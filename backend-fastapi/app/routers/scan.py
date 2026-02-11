from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from jose import JWTError
from sqlmodel import Session, select

from app.core.security import decode_token, hash_nonce
from app.db.session import get_session
from app.deps import require_role
from app.models import LocationPoint, QRToken, ScanEvent, Pass, User
from app.schemas import ScanIn, ScanOut

router = APIRouter()


def deny(reason: str, pass_id: Optional[str] = None) -> ScanOut:
    return ScanOut(result="deny", reason=reason, pass_id=pass_id)


@router.post("", response_model=ScanOut)
def scan_qr(
    payload: ScanIn,
    session: Session = Depends(get_session),
    guard: User = Depends(require_role("security", "admin")),
):
    now = datetime.now(timezone.utc)

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

    jti = claims.get("jti")
    nonce = claims.get("nonce")
    pass_id = claims.get("pass_id")
    phase = claims.get("phase")
    if not jti or not nonce or not pass_id:
        session.add(ScanEvent(gate_id=payload.gate_id, result="deny", reason="missing_claims", scanned_by=guard.id))
        session.commit()
        return deny("missing_claims")

    token_row = session.exec(select(QRToken).where(QRToken.jti == jti)).first()
    if not token_row:
        session.add(ScanEvent(gate_id=payload.gate_id, result="deny", reason="unknown_jti", scanned_by=guard.id))
        session.commit()
        return deny("unknown_jti", pass_id=pass_id)

    if token_row.used_at is not None:
        session.add(ScanEvent(pass_id=token_row.pass_id, gate_id=payload.gate_id, result="deny", reason="replay", scanned_by=guard.id))
        session.commit()
        return deny("replay", pass_id=pass_id)

    if token_row.expires_at.replace(tzinfo=timezone.utc) <= now:
        session.add(ScanEvent(pass_id=token_row.pass_id, gate_id=payload.gate_id, result="deny", reason="expired", scanned_by=guard.id))
        session.commit()
        return deny("expired", pass_id=pass_id)

    if token_row.nonce_hash != hash_nonce(nonce):
        session.add(ScanEvent(pass_id=token_row.pass_id, gate_id=payload.gate_id, result="deny", reason="nonce_mismatch", scanned_by=guard.id))
        session.commit()
        return deny("nonce_mismatch", pass_id=pass_id)

    p = session.get(Pass, token_row.pass_id)
    if not p or p.status != "approved":
        session.add(ScanEvent(pass_id=token_row.pass_id, gate_id=payload.gate_id, result="deny", reason="pass_not_approved", scanned_by=guard.id))
        session.commit()
        return deny("pass_not_approved", pass_id=pass_id)

    # Determine OUT/IN phase based on existing allowed scans and returned_at
    existing_allows = session.exec(
        select(ScanEvent)
        .where(ScanEvent.pass_id == token_row.pass_id, ScanEvent.result == "allow")
        .order_by(ScanEvent.scanned_at.asc())
    ).all()
    if not existing_allows:
        effective_phase = "out"
    elif p.returned_at is None:
        effective_phase = "in"
    else:
        session.add(
            ScanEvent(
                pass_id=token_row.pass_id,
                gate_id=payload.gate_id,
                result="deny",
                reason="already_returned",
                scanned_by=guard.id,
            )
        )
        session.commit()
        return deny("already_returned", pass_id=pass_id)

    # Mark token used (one-time)
    token_row.used_at = now
    session.add(token_row)

    # Record OUT or IN and update pass on IN
    if effective_phase == "out":
        session.add(
            ScanEvent(
                pass_id=token_row.pass_id,
                gate_id=payload.gate_id,
                result="allow",
                reason="out",
                scanned_by=guard.id,
            )
        )
    else:
        p.returned_at = now
        session.add(p)
        session.add(
            ScanEvent(
                pass_id=token_row.pass_id,
                gate_id=payload.gate_id,
                result="allow",
                reason="in",
                scanned_by=guard.id,
            )
        )

    session.commit()

    return ScanOut(result="allow", reason=effective_phase, pass_id=token_row.pass_id)


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
    if p.returned_at and p.to_time:
        delay_minutes = max(
            0.0, (p.returned_at - p.to_time).total_seconds() / 60.0
        )

    return {
        "pass": {
            "id": str(p.id),
            "destination": p.destination,
            "reason": p.reason,
            "from_time": p.from_time,
            "to_time": p.to_time,
            "status": p.status,
            "returned_at": p.returned_at,
        },
        "scanEvents": [
            {
                "gate_id": s.gate_id,
                "result": s.result,
                "reason": s.reason,
                "scanned_at": s.scanned_at,
            }
            for s in scans
        ],
        "locations": [
            {
                "lat": lp.lat,
                "lon": lp.lon,
                "accuracy": lp.accuracy,
                "recorded_at": lp.recorded_at,
            }
            for lp in locations
        ],
        "delayMinutes": delay_minutes,
    }

