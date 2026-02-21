from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.db.session import get_session
from app.deps import get_current_user, require_role
from app.models import Pass, Parent, User
from app.schemas import ApproveIn, PassCreateIn, PassOut
from app.routers.approvals import parent_decide, admin_decide
from app.routers.qr import get_qr_for_pass
from app.services.ml_client import predict_risk
from app.services.feature_engineering import build_feature_vector

router = APIRouter()


IST = timezone(timedelta(hours=5, minutes=30))


def _fmt_dt(dt) -> str | None:
    """Serialize a system datetime (UTC naive, from scan.py / SQLite defaults) to ISO 8601+UTC.
    Frontend: new Date(iso).toLocaleString() correctly shows local IST time."""
    if dt is None:
        return None
    if isinstance(dt, str):
        return dt
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def _fmt_local_dt(dt) -> str | None:
    """Serialize a user-entered local (IST) datetime to ISO 8601+05:30.
    Used for from_time/to_time which come from the browser datetime-local input
    and are stored as naive IST strings, NOT UTC."""
    if dt is None:
        return None
    if isinstance(dt, str):
        return dt
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=IST)
    return dt.isoformat()


def _pass_to_request_dict(p: Pass) -> dict:
    # Node-compat field names used by React pages
    return {
        "_id": str(p.id),
        "studentId": str(p.student_id),
        "type": p.pass_type,
        "destination": p.destination,
        "reason": p.reason,
        # User-entered planned times (stored as IST naive) → stamp as +05:30
        "departureTime": _fmt_local_dt(p.from_time),
        "returnTime": _fmt_local_dt(p.to_time),
        "emergencyContact": p.emergency_contact,
        "status": p.status,
        "riskScore": float(p.risk_score) if p.risk_score is not None else None,
        "riskCategory": p.risk_category,
        "parentComments": p.parent_comments,
        "adminComments": p.admin_comments,
        "parentApprovedAt": _fmt_dt(p.parent_decided_at),
        "adminApprovedAt": _fmt_dt(p.admin_decided_at),
        # Actual gate-scan timestamps (set by scan.py, stored as UTC naive) → stamp as +00:00
        "outAt": _fmt_dt(p.out_at),
        "inAt": _fmt_dt(p.in_at),
        "actualReturnTime": _fmt_dt(p.in_at or p.returned_at),
        "updatedAt": _fmt_dt(p.updated_at),
        "createdAt": _fmt_dt(p.created_at),
        # Old frontend sometimes checks this
        "parentApproved": p.status in ("parent_approved", "approved", "out", "returned"),
    }



@router.post("")
def create_request(
    payload: dict,
    session: Session = Depends(get_session),
    user: User = Depends(require_role("student")),
):
    """
    Compatibility wrapper for the React pages (expects /requests with legacy field names).
    Maps to /passes under the hood.
    """
    # Map legacy payload keys -> PassCreateIn
    try:
        mapped = PassCreateIn(
            pass_type=payload.get("type"),
            destination=payload.get("destination"),
            reason=payload.get("reason"),
            emergency_contact=payload.get("emergencyContact"),
            from_time=payload.get("departureTime"),
            to_time=payload.get("returnTime"),
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid request payload") from e

    # Reuse passes.create_pass logic by constructing Pass directly (keep behavior consistent).
    # Basic validation; detailed rules (including minimum lead time) live in the core /passes API.
    if mapped.to_time <= mapped.from_time:
        raise HTTPException(status_code=400, detail="returnTime must be after departureTime")

    p = Pass(
        student_id=user.id,
        pass_type=mapped.pass_type,
        destination=mapped.destination,
        reason=mapped.reason,
        emergency_contact=mapped.emergency_contact,
        from_time=mapped.from_time,
        to_time=mapped.to_time,
        status="pending_parent",
    )
    session.add(p)
    session.flush()  # assign p.id without committing yet

    # ── ML Risk Scoring ─────────────────────────────────────────────────────
    try:
        features = build_feature_vector(session, user.id, p)
        ml_result = predict_risk(features)
        p.risk_score = ml_result.get("risk_score")
        p.risk_category = ml_result.get("risk_category")
    except Exception as exc:
        # ML failure must never block pass creation
        print(f"[ML] Prediction failed during pass creation: {exc}")
        p.risk_score = None
        p.risk_category = None
    # ────────────────────────────────────────────────────────────────────────

    session.add(p)
    session.commit()
    session.refresh(p)
    return {"message": "Request created successfully", "request": _pass_to_request_dict(p)}


@router.get("")
def list_requests(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    if user.role == "student":
        passes = session.exec(select(Pass).where(Pass.student_id == user.id).order_by(Pass.created_at.desc())).all()
        return {"requests": [_pass_to_request_dict(p) for p in passes]}

    if user.role == "parent":
        parent_link = session.exec(select(Parent).where(Parent.user_id == user.id)).first()
        if not parent_link:
            return {"requests": []}
        passes = session.exec(select(Pass).where(Pass.student_id == parent_link.student_id).order_by(Pass.created_at.desc())).all()
        return {"requests": [_pass_to_request_dict(p) for p in passes]}

    if user.role in ("admin", "security"):
        passes = session.exec(select(Pass).order_by(Pass.created_at.desc())).all()
        return {"requests": [_pass_to_request_dict(p) for p in passes]}

    raise HTTPException(status_code=403, detail="Access denied")


@router.get("/{request_id}")
def get_request(
    request_id: UUID,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    p = session.get(Pass, request_id)
    if not p:
        raise HTTPException(status_code=404, detail="Request not found")
    if user.role == "student" and p.student_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return {"request": _pass_to_request_dict(p)}


@router.put("/{request_id}/parent-approve")
def parent_approve(
    request_id: UUID,
    payload: ApproveIn,
    session: Session = Depends(get_session),
    parent_user: User = Depends(require_role("parent")),
):
    p_out = parent_decide(request_id, payload, session, parent_user)
    # p_out is PassOut, refetch for compat dict
    p = session.get(Pass, request_id)
    return {"message": "Request updated", "request": _pass_to_request_dict(p)}


@router.put("/{request_id}/admin-approve")
def admin_approve(
    request_id: UUID,
    payload: ApproveIn,
    session: Session = Depends(get_session),
    admin_user: User = Depends(require_role("admin")),
):
    p_out = admin_decide(request_id, payload, session, admin_user)
    p = session.get(Pass, request_id)
    return {"message": "Request updated", "request": _pass_to_request_dict(p)}


@router.get("/{request_id}/qr")
def get_qr(
    request_id: UUID,
    session: Session = Depends(get_session),
    user: User = Depends(require_role("student")),
):
    qr_payload = get_qr_for_pass(request_id, session, user)
    # Frontend will render a QR from this token
    return {"qrCode": qr_payload.token, "qrExpiresAt": qr_payload.expires_at}


