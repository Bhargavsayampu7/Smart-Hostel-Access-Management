from __future__ import annotations

from datetime import datetime, timezone
from statistics import mean

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.db.session import get_session
from app.deps import require_role
from app.models import Pass, ScanEvent, Student, StudentBehavioralStats, User

router = APIRouter()



def _parse_dt(val) -> datetime | None:
    """Return a naive datetime from either a datetime object or an ISO string."""
    if val is None:
        return None
    if isinstance(val, datetime):
        return val.replace(tzinfo=None)
    try:
        return datetime.fromisoformat(str(val)).replace(tzinfo=None)
    except Exception:
        return None


def _is_active_pass(p: Pass, now: datetime) -> bool:
    if p.status != "approved":
        return False
    if p.returned_at is not None:
        return False
    to_time = _parse_dt(p.to_time)
    if to_time is None:
        return False
    return to_time > now.replace(tzinfo=None)


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

    # Read behavioral stats from ML stats table (updated after every IN scan)
    bstats = session.exec(
        select(StudentBehavioralStats).where(StudentBehavioralStats.student_id == user.id)
    ).first()

    violations_30d = int(bstats.violations_30d) if bstats else 0
    violations_365d = int(bstats.violations_365d) if bstats else 0
    avg_return_delay = float(bstats.avg_return_delay) if bstats else 0.0
    requests_7d = int(bstats.requests_last_7days) if bstats else 0

    # Student hostel block
    student = session.exec(select(Student).where(Student.user_id == user.id)).first()
    block = (student.hostel_name or "A")[0].upper() if student and student.hostel_name else "A"

    return {
        "totalRequests": total_requests,
        "activeRequests": active,
        "approvedRequests": approved,
        # Real violation counts from behavioral stats table
        "violations": violations_30d,
        "violations_30d": violations_30d,
        "violations_365d": violations_365d,
        "avg_return_delay": avg_return_delay,
        "requests_last_7days": requests_7d,
        "block": block,
    }
