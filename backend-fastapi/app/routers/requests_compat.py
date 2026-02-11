from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.db.session import get_session
from app.deps import get_current_user, require_role
from app.models import Pass, Parent, User
from app.schemas import ApproveIn, PassCreateIn, PassOut
from app.routers.approvals import parent_decide, admin_decide
from app.routers.qr import get_qr_for_pass

router = APIRouter()


def _pass_to_request_dict(p: Pass) -> dict:
    # Node-compat field names used by React pages
    return {
        "_id": str(p.id),
        "studentId": str(p.student_id),
        "type": p.pass_type,
        "destination": p.destination,
        "reason": p.reason,
        "departureTime": p.from_time,
        "returnTime": p.to_time,
        "emergencyContact": p.emergency_contact,
        "status": p.status,
        "riskScore": float(p.risk_score) if p.risk_score is not None else None,
        "riskCategory": p.risk_category,
        "parentComments": p.parent_comments,
        "adminComments": p.admin_comments,
        "parentApprovedAt": p.parent_decided_at,
        "adminApprovedAt": p.admin_decided_at,
        "actualReturnTime": p.returned_at,
        "updatedAt": p.updated_at,
        "createdAt": p.created_at,
        # Old frontend sometimes checks this
        "parentApproved": p.status == "parent_approved" or p.status == "approved",
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


