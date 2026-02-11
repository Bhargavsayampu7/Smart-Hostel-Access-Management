from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.db.session import get_session
from app.deps import require_role
from app.models import Pass, Approval, Parent, User
from app.schemas import ApproveIn, PassOut

router = APIRouter()


@router.put("/parent/{pass_id}", response_model=PassOut)
def parent_decide(
    pass_id: UUID,
    payload: ApproveIn,
    session: Session = Depends(get_session),
    parent_user: User = Depends(require_role("parent")),
):
    parent_link = session.exec(select(Parent).where(Parent.user_id == parent_user.id)).first()
    if not parent_link:
        raise HTTPException(status_code=403, detail="Parent is not linked to a student")

    p = session.get(Pass, pass_id)
    if not p:
        raise HTTPException(status_code=404, detail="Pass not found")
    if p.student_id != parent_link.student_id:
        raise HTTPException(status_code=403, detail="Access denied")
    if p.status != "pending_parent":
        raise HTTPException(status_code=400, detail="Pass is not pending parent approval")

    now = datetime.now(timezone.utc)
    p.parent_comments = payload.comments
    p.parent_decided_at = now
    p.status = "parent_approved" if payload.approved else "parent_rejected"

    session.add(Approval(
        pass_id=p.id,
        approved_by=parent_user.id,
        role="parent",
        decision="approve" if payload.approved else "reject",
        comments=payload.comments,
        decided_at=now,
    ))
    session.add(p)
    session.commit()
    session.refresh(p)
    return PassOut.model_validate(p)


@router.put("/admin/{pass_id}", response_model=PassOut)
def admin_decide(
    pass_id: UUID,
    payload: ApproveIn,
    session: Session = Depends(get_session),
    admin_user: User = Depends(require_role("admin")),
):
    p = session.get(Pass, pass_id)
    if not p:
        raise HTTPException(status_code=404, detail="Pass not found")
    if p.status != "parent_approved":
        raise HTTPException(status_code=400, detail="Pass must be parent-approved first")

    now = datetime.now(timezone.utc)
    p.admin_comments = payload.comments
    p.admin_decided_at = now
    p.status = "approved" if payload.approved else "rejected"

    session.add(Approval(
        pass_id=p.id,
        approved_by=admin_user.id,
        role="admin",
        decision="approve" if payload.approved else "reject",
        comments=payload.comments,
        decided_at=now,
    ))
    session.add(p)
    session.commit()
    session.refresh(p)
    return PassOut.model_validate(p)


