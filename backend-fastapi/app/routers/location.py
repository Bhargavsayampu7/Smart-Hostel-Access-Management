from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.db.session import get_session
from app.deps import require_role, get_current_user
from app.models import Pass, LocationPoint, Parent, User
from app.schemas import LocationIn, LocationOut

router = APIRouter()


def pass_is_active(p: Pass, now: datetime) -> bool:
    if p.status != "approved":
        return False
    if p.returned_at is not None:
        return False
    return p.to_time.replace(tzinfo=None) > now.replace(tzinfo=None)


@router.post("", response_model=LocationOut)
def send_location(
    payload: LocationIn,
    session: Session = Depends(get_session),
    student: User = Depends(require_role("student")),
):
    p = session.get(Pass, payload.pass_id)
    if not p:
        raise HTTPException(status_code=404, detail="Pass not found")
    if p.student_id != student.id:
        raise HTTPException(status_code=403, detail="Access denied")

    now = datetime.now(timezone.utc)
    if not pass_is_active(p, now):
        raise HTTPException(status_code=400, detail="Location tracking allowed only for active passes")

    recorded_at = payload.recorded_at or now
    point = LocationPoint(
        pass_id=p.id,
        lat=payload.lat,
        lon=payload.lon,
        accuracy=payload.accuracy,
        recorded_at=recorded_at,
    )
    session.add(point)
    session.commit()
    session.refresh(point)
    return LocationOut(pass_id=point.pass_id, lat=point.lat, lon=point.lon, accuracy=point.accuracy, recorded_at=point.recorded_at)


@router.get("/latest/{pass_id}", response_model=LocationOut)
def latest_location(
    pass_id: UUID,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    p = session.get(Pass, pass_id)
    if not p:
        raise HTTPException(status_code=404, detail="Pass not found")

    if user.role == "student":
        if p.student_id != user.id:
            raise HTTPException(status_code=403, detail="Access denied")
    elif user.role == "parent":
        parent_link = session.exec(select(Parent).where(Parent.user_id == user.id)).first()
        if not parent_link or parent_link.student_id != p.student_id:
            raise HTTPException(status_code=403, detail="Access denied")
    elif user.role not in ("admin", "security"):
        raise HTTPException(status_code=403, detail="Access denied")

    point = session.exec(
        select(LocationPoint).where(LocationPoint.pass_id == pass_id).order_by(LocationPoint.recorded_at.desc())
    ).first()
    if not point:
        raise HTTPException(status_code=404, detail="No location data")

    return LocationOut(pass_id=point.pass_id, lat=point.lat, lon=point.lon, accuracy=point.accuracy, recorded_at=point.recorded_at)


