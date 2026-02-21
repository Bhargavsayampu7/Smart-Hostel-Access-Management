"""
Gate QR Scan Router — Status-driven state machine.

Pass lifecycle:
  approved  → OUT scan → status = "out",      out_at = now
  out       → IN  scan → status = "returned", in_at  = now, violation if late
  returned  → DENY (already completed)

Phase is determined by pass.status, NOT by counting prior scan_events.
QR token is burned on each valid scan (one-time use enforced via used_at).
"""
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from jose import JWTError
from sqlmodel import Session, select

from app.core.security import decode_token, hash_nonce
from app.db.session import get_session
from app.deps import require_role
from app.models import LocationPoint, QRToken, ScanEvent, Pass, User, Violation
from app.schemas import ScanIn, ScanOut
from app.services.feature_engineering import refresh_behavioral_stats

router = APIRouter()


def _now_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def deny(reason: str, pass_id: Optional[str] = None) -> ScanOut:
    return ScanOut(result="deny", reason=reason, pass_id=pass_id)


@router.post("", response_model=ScanOut)
def scan_qr(
    payload: ScanIn,
    session: Session = Depends(get_session),
    guard: User = Depends(require_role("security", "admin")),
):
    now = _now_naive()

    # ── 1. Decode and validate JWT ─────────────────────────────────────────────
    try:
        claims = decode_token(payload.token)
    except JWTError:
        session.add(ScanEvent(gate_id=payload.gate_id, result="deny", reason="invalid_token", scanned_by=guard.id))
        session.commit()
        return deny("invalid_token")

    if claims.get("typ") != "gate_qr":
        session.add(ScanEvent(gate_id=payload.gate_id, result="deny", reason="wrong_token_type", scanned_by=guard.id))
        session.commit()
        return deny("wrong_token_type")

    jti   = claims.get("jti")
    nonce = claims.get("nonce")
    pass_id_str = claims.get("pass_id")

    if not jti or not nonce or not pass_id_str:
        session.add(ScanEvent(gate_id=payload.gate_id, result="deny", reason="missing_claims", scanned_by=guard.id))
        session.commit()
        return deny("missing_claims")

    # ── 2. Validate QR token row ───────────────────────────────────────────────
    token_row = session.exec(select(QRToken).where(QRToken.jti == jti)).first()
    if not token_row:
        session.add(ScanEvent(gate_id=payload.gate_id, result="deny", reason="unknown_jti", scanned_by=guard.id))
        session.commit()
        return deny("unknown_jti", pass_id=pass_id_str)

    if token_row.used_at is not None:
        session.add(ScanEvent(pass_id=token_row.pass_id, gate_id=payload.gate_id, result="deny", reason="replay", scanned_by=guard.id))
        session.commit()
        return deny("replay", pass_id=pass_id_str)

    token_row_expires = token_row.expires_at.replace(tzinfo=None) if token_row.expires_at.tzinfo else token_row.expires_at
    if token_row_expires <= now:
        session.add(ScanEvent(pass_id=token_row.pass_id, gate_id=payload.gate_id, result="deny", reason="expired", scanned_by=guard.id))
        session.commit()
        return deny("expired", pass_id=pass_id_str)

    if token_row.nonce_hash != hash_nonce(nonce):
        session.add(ScanEvent(pass_id=token_row.pass_id, gate_id=payload.gate_id, result="deny", reason="nonce_mismatch", scanned_by=guard.id))
        session.commit()
        return deny("nonce_mismatch", pass_id=pass_id_str)

    # ── 3. Load pass ───────────────────────────────────────────────────────────
    p = session.get(Pass, token_row.pass_id)
    if not p:
        session.add(ScanEvent(gate_id=payload.gate_id, result="deny", reason="pass_not_found", scanned_by=guard.id))
        session.commit()
        return deny("pass_not_found", pass_id=pass_id_str)

    # ── 4. State machine — determine phase from pass.status ───────────────────
    if p.status == "approved":
        # ── OUT SCAN ──────────────────────────────────────────────────────────
        p.out_at = now
        p.status = "out"
        p.updated_at = now
        session.add(p)

        # Burn QR token (one-time use)
        token_row.used_at = now
        session.add(token_row)

        session.add(ScanEvent(
            pass_id=p.id,
            gate_id=payload.gate_id,
            result="allow",
            reason="out",
            scanned_by=guard.id,
            scanned_at=now,
        ))
        session.commit()
        return ScanOut(result="allow", reason="out", pass_id=str(p.id))

    elif p.status == "out":
        # ── IN SCAN ───────────────────────────────────────────────────────────
        now_local = datetime.now()   # naive local time — same frame as DB stored to_time
        p.in_at = now
        p.returned_at = now          # backward compat (UTC naive, for history)
        p.status = "returned"
        p.updated_at = now
        session.add(p)

        # Burn QR token
        token_row.used_at = now
        session.add(token_row)

        # ── Late return detection (compare in local time frame) ───────────────
        delay_minutes: float = 0.0
        try:
            if p.to_time is None:
                print("[SCAN] to_time is None — cannot check lateness")
            else:
                # to_time stored as naive local time from frontend datetime-local input
                to_time_local = p.to_time.replace(tzinfo=None) if getattr(p.to_time, 'tzinfo', None) else p.to_time

                # DEBUG — confirm values
                print(f"[SCAN] to_time (local naive): {to_time_local}")
                print(f"[SCAN] now     (local naive): {now_local}")
                diff_min = (now_local - to_time_local).total_seconds() / 60.0
                print(f"[SCAN] diff_minutes: {diff_min:.2f}")

                if diff_min > 0:
                    delay_minutes = diff_min
                    severity = 1 if delay_minutes < 30 else (2 if delay_minutes < 120 else 3)
                    session.add(Violation(
                        student_id=p.student_id,
                        pass_id=p.id,
                        violation_type="late_return",
                        severity=severity,
                        delay_minutes=round(delay_minutes, 1),
                    ))
                    session.flush()
                    print(f"[SCAN] ⚠️  VIOLATION inserted: {round(delay_minutes, 1)} min late")
                else:
                    print("[SCAN] ✅ On-time return. No violation.")

            # Always refresh stats
            refresh_behavioral_stats(session, p.student_id)
        except Exception as exc:
            import traceback
            print(f"[SCAN] Violation/stats update failed: {exc}")
            traceback.print_exc()

        session.add(ScanEvent(
            pass_id=p.id,
            gate_id=payload.gate_id,
            result="allow",
            reason="in",
            scanned_by=guard.id,
            scanned_at=now,
        ))
        session.commit()

        # Build human-readable message
        if delay_minutes > 0:
            msg = f"⚠️ Allowed with violation: {round(delay_minutes)} minutes late"
        else:
            msg = "✅ On-time return. No violation."

        return ScanOut(result="allow", reason="in", pass_id=str(p.id), message=msg)


    elif p.status == "returned":
        # Already completed — deny
        session.add(ScanEvent(
            pass_id=p.id,
            gate_id=payload.gate_id,
            result="deny",
            reason="already_returned",
            scanned_by=guard.id,
        ))
        session.commit()
        return deny("already_returned", pass_id=pass_id_str)

    else:
        # pending_parent / parent_approved → pass not yet activated
        session.add(ScanEvent(
            pass_id=p.id,
            gate_id=payload.gate_id,
            result="deny",
            reason="pass_not_approved",
            scanned_by=guard.id,
        ))
        session.commit()
        return deny("pass_not_approved", pass_id=pass_id_str)


@router.get("/history/{pass_id}")
def history(
    pass_id: UUID,
    session: Session = Depends(get_session),
    user: User = Depends(require_role("security", "admin")),
):
    """Return scan + location history and delay analytics for a pass."""
    p = session.get(Pass, pass_id)
    if not p:
        raise HTTPException(status_code=404, detail="Pass not found")

    scans = session.exec(
        select(ScanEvent)
        .where(ScanEvent.pass_id == pass_id)
        .order_by(ScanEvent.scanned_at.asc())
    ).all()
    locations = session.exec(
        select(LocationPoint)
        .where(LocationPoint.pass_id == pass_id)
        .order_by(LocationPoint.recorded_at.asc())
    ).all()

    delay_minutes: float = 0.0
    if p.in_at and p.to_time:
        to_time_naive = p.to_time.replace(tzinfo=None) if p.to_time.tzinfo else p.to_time
        in_at_naive   = p.in_at.replace(tzinfo=None) if p.in_at.tzinfo else p.in_at
        delay_minutes = max(0.0, (in_at_naive - to_time_naive).total_seconds() / 60.0)

    return {
        "pass": {
            "id":          str(p.id),
            "destination": p.destination,
            "reason":      p.reason,
            "from_time":   p.from_time,
            "to_time":     p.to_time,
            "out_at":      p.out_at,
            "in_at":       p.in_at,
            "status":      p.status,
        },
        "scanEvents": [
            {
                "gate_id":    s.gate_id,
                "result":     s.result,
                "reason":     s.reason,
                "scanned_at": s.scanned_at,
            }
            for s in scans
        ],
        "locations": [
            {
                "lat":         lp.lat,
                "lon":         lp.lon,
                "accuracy":    lp.accuracy,
                "recorded_at": lp.recorded_at,
            }
            for lp in locations
        ],
        "delayMinutes": delay_minutes,
    }
