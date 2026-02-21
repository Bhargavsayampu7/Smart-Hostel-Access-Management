from __future__ import annotations

from datetime import datetime, timezone
from collections import Counter, defaultdict
from typing import Dict, List

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlmodel import Session, select

from app.db.session import get_session
from app.deps import require_role
from app.models import Pass, User, Violation, ScanEvent
from app.routers.requests_compat import _pass_to_request_dict

router = APIRouter()


def _is_active(p: Pass, now: datetime) -> bool:
    return p.status in ("approved", "out")



@router.get("/queue")
def queue(
    session: Session = Depends(get_session),
    admin_user: User = Depends(require_role("admin")),
):
    passes = session.exec(select(Pass).where(Pass.status == "parent_approved").order_by(Pass.created_at.desc())).all()
    items = []
    for p in passes:
        d = _pass_to_request_dict(p)
        # Resolve student name from users table
        student_user = session.get(User, p.student_id)
        d["studentName"] = student_user.name if student_user else ""
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
    late_returns = session.exec(
        select(func.count(Violation.id)).where(Violation.violation_type == "late_return")
    ).one() or 0
    all_violations = session.exec(select(func.count(Violation.id))).one() or 0
    return {
        "totalStudents": total_students,
        "pendingRequests": sum(1 for p in all_passes if p.status in ("pending_parent", "parent_approved")),
        "activeOutpasses": sum(1 for p in all_passes if _is_active(p, now)),
        "violations": all_violations,
        "lateReturns": late_returns,
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


@router.get("/gate-logs")
def gate_logs(
    session: Session = Depends(get_session),
    admin_user: User = Depends(require_role("admin")),
):
    """Gate scan events for the Warden Gate Logs tab."""
    events = session.exec(
        select(ScanEvent).order_by(ScanEvent.scanned_at.desc()).limit(200)
    ).all()
    items = []
    for e in events:
        student_name = ""
        if e.pass_id:
            p = session.get(Pass, e.pass_id)
            if p:
                u = session.get(User, p.student_id)
                student_name = u.name if u else ""
        items.append({
            "id": e.id,
            "passId": str(e.pass_id) if e.pass_id else None,
            "studentName": student_name,
            "gateId": e.gate_id,
            "result": e.result,
            "reason": e.reason,
            "scannedAt": e.scanned_at.replace(tzinfo=timezone.utc).isoformat() if e.scanned_at else None,
        })
    return {"gateLogs": items}


@router.get("/violations-list")
def violations_list(
    session: Session = Depends(get_session),
    admin_user: User = Depends(require_role("admin")),
):
    """Violations list for Warden Violations tab."""
    viols = session.exec(
        select(Violation).order_by(Violation.recorded_at.desc()).limit(200)
    ).all()
    items = []
    for v in viols:
        u = session.get(User, v.student_id)
        items.append({
            "id": v.id,
            "studentName": u.name if u else str(v.student_id),
            "passId": str(v.pass_id),
            "violationType": v.violation_type,
            "severity": v.severity,
            "delayMinutes": v.delay_minutes,
            "recordedAt": v.recorded_at.replace(tzinfo=timezone.utc).isoformat() if v.recorded_at else None,
        })
    return {"violations": items}
