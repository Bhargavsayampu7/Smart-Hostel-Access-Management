from __future__ import annotations

from statistics import mean

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.db.session import get_session
from app.deps import require_role
from app.models import Parent, Pass, ScanEvent, User
from app.routers.requests_compat import _pass_to_request_dict

router = APIRouter()


def _get_link(session: Session, parent_user: User) -> Parent:
    link = session.exec(select(Parent).where(Parent.user_id == parent_user.id)).first()
    if not link:
        raise HTTPException(status_code=403, detail="Parent is not linked to a student")
    return link


@router.get("/pending-approvals")
def pending(
    session: Session = Depends(get_session),
    parent_user: User = Depends(require_role("parent")),
):
    link = _get_link(session, parent_user)
    passes = session.exec(
        select(Pass).where(Pass.student_id == link.student_id, Pass.status == "pending_parent").order_by(Pass.created_at.desc())
    ).all()
    data = []
    for p in passes:
        d = _pass_to_request_dict(p)
        d["studentName"] = ""  # UI uses this
        data.append(d)
    return {"requests": data}


@router.get("/activity")
def activity(
    session: Session = Depends(get_session),
    parent_user: User = Depends(require_role("parent")),
):
    link = _get_link(session, parent_user)
    passes = session.exec(select(Pass).where(Pass.student_id == link.student_id).order_by(Pass.updated_at.desc())).all()
    data = []
    for p in passes:
        d = _pass_to_request_dict(p)
        d["studentName"] = ""
        data.append(d)
    return {"requests": data}


@router.get("/dashboard")
def dashboard(
    session: Session = Depends(get_session),
    parent_user: User = Depends(require_role("parent")),
):
    link = _get_link(session, parent_user)
    passes = session.exec(select(Pass).where(Pass.student_id == link.student_id)).all()

    pending_count = sum(1 for p in passes if p.status == "pending_parent")
    approved_count = sum(1 for p in passes if p.status == "approved")

    # Child violations based on denied scans
    total_requests = len(passes)
    if total_requests:
        pass_ids = [p.id for p in passes]
        scan_events = session.exec(
            select(ScanEvent).where(ScanEvent.pass_id.in_(pass_ids))
        ).all()
        child_violations = sum(1 for ev in scan_events if ev.result == "deny")
    else:
        child_violations = 0

    # ML-backed child risk based on stored pass risk scores
    ml_scores = [
        float(p.risk_score)
        for p in passes
        if p.risk_score is not None
    ]
    if ml_scores:
        child_risk = mean(ml_scores)
    else:
        child_risk = 0.0

    return {
        "pendingCount": pending_count,
        "approvedCount": approved_count,
        "childRisk": child_risk,
        "childViolations": child_violations,
    }


