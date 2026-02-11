from __future__ import annotations

from datetime import datetime, timezone
from collections import Counter, defaultdict
from typing import Dict, List

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.db.session import get_session
from app.deps import require_role
from app.models import Pass, User
from app.routers.requests_compat import _pass_to_request_dict

router = APIRouter()


def _is_active(p: Pass, now: datetime) -> bool:
    if p.status != "approved":
        return False
    if p.returned_at is not None:
        return False
    return p.to_time.replace(tzinfo=None) > now.replace(tzinfo=None)


@router.get("/queue")
def queue(
    session: Session = Depends(get_session),
    admin_user: User = Depends(require_role("admin")),
):
    passes = session.exec(select(Pass).where(Pass.status == "parent_approved").order_by(Pass.created_at.desc())).all()
    items = []
    for p in passes:
        d = _pass_to_request_dict(p)
        d["studentName"] = ""
        d["mlRiskScore"] = d.get("riskScore")
        items.append(d)
    return {"requests": items}


@router.get("/overview")
def overview(
    session: Session = Depends(get_session),
    admin_user: User = Depends(require_role("admin")),
):
    all_passes = session.exec(select(Pass)).all()
    now = datetime.now(timezone.utc)
    # sqlmodel's exec() returns a Result; materialize to list before counting
    total_students = len(session.exec(select(User).where(User.role == "student")).all())
    return {
        "totalStudents": total_students,
        "pendingRequests": sum(1 for p in all_passes if p.status in ("pending_parent", "parent_approved")),
        "activeOutpasses": sum(1 for p in all_passes if _is_active(p, now)),
        "violations": 0,
    }


@router.get("/students")
def students(
    session: Session = Depends(get_session),
    admin_user: User = Depends(require_role("admin")),
):
    # Return list of student users with latest pass + risk summary
    users = session.exec(select(User).where(User.role == "student")).all()
    result: List[Dict] = []
    for u in users:
        latest_pass = session.exec(
            select(Pass)
            .where(Pass.student_id == u.id)
            .order_by(Pass.created_at.desc())
        ).first()
        result.append(
            {
                "id": str(u.id),
                "name": u.name,
                "email": u.email,
                "latestPassStatus": latest_pass.status if latest_pass else None,
                "latestPassCreatedAt": latest_pass.created_at if latest_pass else None,
                "riskScore": float(latest_pass.risk_score)
                if latest_pass and latest_pass.risk_score is not None
                else None,
                "riskCategory": latest_pass.risk_category if latest_pass else None,
            }
        )
    return {"students": result}


@router.get("/reports")
def reports(
    session: Session = Depends(get_session),
    admin_user: User = Depends(require_role("admin")),
):
    # Backwards-compatible alias for analytics
    return analytics(session=session, admin_user=admin_user)


@router.get("/analytics")
def analytics(
    session: Session = Depends(get_session),
    admin_user: User = Depends(require_role("admin")),
):
    """Return high-level analytics for the warden dashboard."""
    passes = session.exec(select(Pass)).all()

    # Risk distribution based on stored ML categories
    risk_counter: Counter = Counter()
    for p in passes:
        if p.risk_category:
            risk_counter[p.risk_category.lower()] += 1

    risk_distribution = {
        "low": risk_counter.get("low", 0),
        "medium": risk_counter.get("medium", 0),
        "high": risk_counter.get("high", 0),
        "unknown": risk_counter.get("", 0)
        + sum(
            v
            for k, v in risk_counter.items()
            if k not in {"low", "medium", "high", ""}
        ),
    }

    # Late returns (returned_at after to_time), grouped by day
    late_by_day: Dict[str, int] = defaultdict(int)
    for p in passes:
        if p.returned_at and p.to_time and p.returned_at > p.to_time:
            day = p.returned_at.date().isoformat()
            late_by_day[day] += 1

    late_returns = [
        {"date": day, "count": count}
        for day, count in sorted(late_by_day.items())
    ]

    # Parent response time histogram (minutes between created_at and parent_decided_at)
    buckets = {
        "0-5": 0,
        "5-15": 0,
        "15-60": 0,
        "60+": 0,
    }
    for p in passes:
        if p.parent_decided_at and p.created_at:
            delta_min = (p.parent_decided_at - p.created_at).total_seconds() / 60.0
            if delta_min <= 5:
                buckets["0-5"] += 1
            elif delta_min <= 15:
                buckets["5-15"] += 1
            elif delta_min <= 60:
                buckets["15-60"] += 1
            else:
                buckets["60+"] += 1

    parent_response_histogram = [
        {"bucket": name, "count": count} for name, count in buckets.items()
    ]

    return {
        "riskDistribution": risk_distribution,
        "lateReturnsByDay": late_returns,
        "parentResponseHistogram": parent_response_histogram,
    }


