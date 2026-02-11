from datetime import datetime, timezone, timedelta
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.db.session import get_session
from app.deps import require_role, get_current_user
from app.models import Pass, User
from app.schemas import PassCreateIn, PassOut
from app.services.ml_client import predict_risk
from app.models import Pass, User
from app.schemas import PassCreateIn, PassOut

router = APIRouter()


def is_pass_active(p: Pass, now: datetime) -> bool:
    if p.status != "approved":
        return False
    if p.returned_at is not None:
        return False
    return p.to_time.replace(tzinfo=None) > now.replace(tzinfo=None)


@router.post("", response_model=PassOut)
def create_pass(
    payload: PassCreateIn,
    session: Session = Depends(get_session),
    user: User = Depends(require_role("student")),
):
    now = datetime.now(timezone.utc)

    if payload.to_time <= payload.from_time:
        raise HTTPException(status_code=400, detail="to_time must be after from_time")
    if payload.from_time <= (now + timedelta(minutes=30)):
        raise HTTPException(status_code=400, detail="from_time must be at least 30 minutes from now")

    # Enforce one-active-pass rule (requested): only one active approved pass at a time.
    existing = session.exec(select(Pass).where(Pass.student_id == user.id)).all()
    if any(is_pass_active(p, now) for p in existing):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An active pass already exists for this student",
        )

    p = Pass(
        student_id=user.id,
        pass_type=payload.pass_type,
        destination=payload.destination,
        reason=payload.reason,
        emergency_contact=payload.emergency_contact,
        from_time=payload.from_time,
        to_time=payload.to_time,
        status="pending_parent",
    )
    session.add(p)
    session.commit()
    session.refresh(p)
    return PassOut.model_validate(p)


@router.get("", response_model=List[PassOut])
def list_my_passes(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    if user.role == "student":
        passes = session.exec(select(Pass).where(Pass.student_id == user.id).order_by(Pass.created_at.desc())).all()
        return [PassOut.model_validate(p) for p in passes]

    # In new stack, parent/admin listing will use dedicated endpoints (to be added)
    raise HTTPException(status_code=403, detail="Not supported for this role yet")


@router.get("/{pass_id}", response_model=PassOut)
def get_pass(
    pass_id: UUID,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    p = session.get(Pass, pass_id)
    if not p:
        raise HTTPException(status_code=404, detail="Pass not found")
    if user.role == "student" and p.student_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return PassOut.model_validate(p)


