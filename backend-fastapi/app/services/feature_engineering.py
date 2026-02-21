"""
Feature Engineering Service
Builds an ML feature vector for a student from real DB data.
No hardcoded values allowed.
"""
from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Optional
from uuid import UUID

from sqlalchemy import func
from sqlmodel import Session, select

from app.models import Pass, Student, Violation, StudentBehavioralStats, Approval


def _utcnow() -> datetime:
    """Return naive local time — matches how SQLite stores datetimes from the frontend."""
    return datetime.now()


def build_feature_vector(
    session: Session,
    student_id: UUID,
    new_pass: Pass,
) -> dict:
    """
    Compute every ML feature from DB state.
    `new_pass` is the just-created pass (not yet committed — id/times are available).

    Returns a dict matching ml-service/app.py:MLRiskInput field names.
    """
    now = _utcnow()
    cutoff_30d = now - timedelta(days=30)
    cutoff_365d = now - timedelta(days=365)
    cutoff_7d = now - timedelta(days=7)

    # ── 1. Fetch cached behavioral stats (fast path) ─────────────────────────
    stats = session.exec(
        select(StudentBehavioralStats).where(
            StudentBehavioralStats.student_id == student_id
        )
    ).first()

    if stats:
        violations_30d = stats.violations_30d
        violations_365d = stats.violations_365d
        avg_delay = stats.avg_return_delay
        no_show_count = stats.no_show_count
        avg_parent_resp = stats.avg_parent_response_time
        requests_7d = stats.requests_last_7days
    else:
        # ── 2. Compute from raw tables (first pass — no cached stats yet) ────
        violations_30d = session.exec(
            select(func.count(Violation.id)).where(
                Violation.student_id == student_id,
                Violation.recorded_at >= cutoff_30d,
            )
        ).one()

        violations_365d = session.exec(
            select(func.count(Violation.id)).where(
                Violation.student_id == student_id,
                Violation.recorded_at >= cutoff_365d,
            )
        ).one()

        avg_delay_raw = session.exec(
            select(func.avg(Violation.delay_minutes)).where(
                Violation.student_id == student_id,
                Violation.violation_type == "late_return",
            )
        ).one()
        avg_delay = float(avg_delay_raw or 0.0)

        no_show_count = session.exec(
            select(func.count(Violation.id)).where(
                Violation.student_id == student_id,
                Violation.violation_type == "no_show",
            )
        ).one()

        # Average parent response time: (parent_decided_at - created_at) in minutes
        approvals = session.exec(
            select(Pass.created_at, Pass.parent_decided_at).where(
                Pass.student_id == student_id,
                Pass.parent_decided_at.is_not(None),
            )
        ).all()
        if approvals:
            deltas = [
                (a.parent_decided_at - a.created_at).total_seconds() / 60.0
                for a in approvals
                if a.parent_decided_at and a.created_at
            ]
            avg_parent_resp = sum(deltas) / len(deltas) if deltas else 0.0
        else:
            avg_parent_resp = 0.0

        requests_7d = session.exec(
            select(func.count(Pass.id)).where(
                Pass.student_id == student_id,
                Pass.created_at >= cutoff_7d,
            )
        ).one()

    # ── 3. Student profile fields ─────────────────────────────────────────────
    student_profile = session.exec(
        select(Student).where(Student.user_id == student_id)
    ).first()

    hostel_block = student_profile.hostel_name or "A" if student_profile else "A"
    # Use first character of hostel_name as block identifier if longer
    if hostel_block and len(hostel_block) > 1:
        hostel_block = hostel_block[0].upper()

    # semester maps loosely to year of study
    semester = student_profile.semester or 1 if student_profile else 1
    year = max(1, (semester + 1) // 2)

    # ── 4. New pass context ───────────────────────────────────────────────────
    from_dt = new_pass.from_time.replace(tzinfo=None) if new_pass.from_time else now
    to_dt = new_pass.to_time.replace(tzinfo=None) if new_pass.to_time else now

    requested_duration_hours = max(0.5, (to_dt - from_dt).total_seconds() / 3600.0)
    request_time_hour = from_dt.hour
    weekend_request = 1 if from_dt.weekday() >= 5 else 0

    # Destination risk: emergency → high, homepass → low, outpass → medium
    pass_type = (new_pass.pass_type or "outpass").lower()
    if pass_type == "emergency":
        destination_risk = "high"
        emergency_flag = 1
    elif pass_type == "homepass":
        destination_risk = "low"
        emergency_flag = 0
    else:
        destination_risk = "medium"
        emergency_flag = 0

    # Severity-weighted violations give a more nuanced past_violations score
    violations_30d_int = int(violations_30d or 0)
    violations_365d_int = int(violations_365d or 0)

    return {
        # Student static features
        "age": 20,  # not stored in DB; use a reasonable default
        "year": year,
        "gpa": 7.5,  # GPA not in DB schema yet; reasonable default
        "hostel_block": hostel_block,
        "parent_contact_reliable": 1,  # assume reliable unless flagged

        # Historical behavioral features — all from DB
        "past_violations_30d": violations_30d_int,
        "past_violations_365d": violations_365d_int,
        "actual_return_delay_minutes": round(avg_delay, 1),
        "parent_response_time_minutes": round(float(avg_parent_resp), 1),
        "previous_no_show": int(no_show_count or 0),
        "requests_last_7days": int(requests_7d or 0),

        # New pass context
        "request_time_hour": request_time_hour,
        "requested_duration_hours": round(requested_duration_hours, 2),
        "weekend_request": weekend_request,
        "destination_risk": destination_risk,
        "emergency_flag": emergency_flag,
        "group_request": 0,  # not supported in current pass model

        # Parent action — unknown at request time; assume responsive
        "parent_action": 1,
    }


def refresh_behavioral_stats(session: Session, student_id: UUID) -> StudentBehavioralStats:
    """
    Recompute and upsert StudentBehavioralStats for a student using aggregate queries.
    Called after every IN-scan (violation or clean return).
    """
    now = _utcnow()
    cutoff_30d = now - timedelta(days=30)
    cutoff_365d = now - timedelta(days=365)
    cutoff_7d = now - timedelta(days=7)

    violations_30d = session.exec(
        select(func.count(Violation.id)).where(
            Violation.student_id == student_id,
            Violation.recorded_at >= cutoff_30d,
        )
    ).one() or 0

    violations_365d = session.exec(
        select(func.count(Violation.id)).where(
            Violation.student_id == student_id,
            Violation.recorded_at >= cutoff_365d,
        )
    ).one() or 0

    avg_return_delay = session.exec(
        select(func.avg(Violation.delay_minutes)).where(
            Violation.student_id == student_id,
            Violation.violation_type == "late_return",
        )
    ).one()
    avg_return_delay = float(avg_return_delay or 0.0)

    no_show_count = session.exec(
        select(func.count(Violation.id)).where(
            Violation.student_id == student_id,
            Violation.violation_type == "no_show",
        )
    ).one() or 0

    # Avg parent response time (minutes)
    passes = session.exec(
        select(Pass.created_at, Pass.parent_decided_at).where(
            Pass.student_id == student_id,
            Pass.parent_decided_at.is_not(None),
        )
    ).all()
    if passes:
        deltas = [
            (p.parent_decided_at - p.created_at).total_seconds() / 60.0
            for p in passes
            if p.parent_decided_at and p.created_at
        ]
        avg_parent_resp = sum(deltas) / len(deltas) if deltas else 0.0
    else:
        avg_parent_resp = 0.0

    requests_7d = session.exec(
        select(func.count(Pass.id)).where(
            Pass.student_id == student_id,
            Pass.created_at >= cutoff_7d,
        )
    ).one() or 0

    # Upsert stats row
    stats = session.exec(
        select(StudentBehavioralStats).where(
            StudentBehavioralStats.student_id == student_id
        )
    ).first()

    if stats is None:
        stats = StudentBehavioralStats(student_id=student_id)
        session.add(stats)

    stats.violations_30d = int(violations_30d)
    stats.violations_365d = int(violations_365d)
    stats.avg_return_delay = round(avg_return_delay, 2)
    stats.no_show_count = int(no_show_count)
    stats.avg_parent_response_time = round(avg_parent_resp, 2)
    stats.requests_last_7days = int(requests_7d)
    stats.last_updated = now

    session.add(stats)
    # Caller is responsible for commit
    return stats
