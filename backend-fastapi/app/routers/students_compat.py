from __future__ import annotations

from datetime import datetime, timezone
from statistics import mean

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.db.session import get_session
from app.deps import require_role
from app.models import Pass, ScanEvent, Student, User

router = APIRouter()


def _is_active_pass(p: Pass, now: datetime) -> bool:
    if p.status != "approved":
        return False
    if p.returned_at is not None:
        return False
    return p.to_time.replace(tzinfo=None) > now.replace(tzinfo=None)


@router.get("/profile")
def profile(
    session: Session = Depends(get_session),
    user: User = Depends(require_role("student")),
):
    s = session.exec(select(Student).where(Student.user_id == user.id)).first()
    return {
        "student": {
            "id": str(user.id),
            "email": user.email,
            "role": user.role,
            "personalInfo": {"fullName": user.name},
            "academicInfo": {"branch": getattr(s, "branch", None), "semester": getattr(s, "semester", None)},
            "hostelInfo": {"hostelName": getattr(s, "hostel_name", None), "roomNumber": getattr(s, "room_no", None)},
        }
    }


@router.get("/stats")
def stats(
    session: Session = Depends(get_session),
    user: User = Depends(require_role("student")),
):
    passes = session.exec(select(Pass).where(Pass.student_id == user.id)).all()
    now = datetime.now(timezone.utc)

    total_requests = len(passes)
    active = sum(1 for p in passes if _is_active_pass(p, now))
    approved = sum(1 for p in passes if p.status == "approved")

    # Violation count based on denied scans for this student's passes
    if total_requests:
        pass_ids = [p.id for p in passes]
        scan_events = session.exec(
            select(ScanEvent).where(ScanEvent.pass_id.in_(pass_ids))
        ).all()
        violations = sum(1 for ev in scan_events if ev.result == "deny")
    else:
        violations = 0

    # ML-backed risk: aggregate stored risk_score from passes
    ml_scores = [
        float(p.risk_score)
        for p in passes
        if p.risk_score is not None
    ]
    if ml_scores:
        risk_score = mean(ml_scores)
    else:
        risk_score = 0.0

    return {
        "totalRequests": total_requests,
        "activeRequests": active,
        "approvedRequests": approved,
        "violations": violations,
        "riskScore": risk_score,
    }


