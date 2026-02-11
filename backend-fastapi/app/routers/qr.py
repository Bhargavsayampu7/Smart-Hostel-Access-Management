from datetime import datetime, timezone, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.config import QR_TOKEN_TTL_MINUTES
from app.core.security import create_access_token, new_jti, new_nonce, hash_nonce
from app.db.session import get_session
from app.deps import require_role
from app.models import Pass, QRToken, ScanEvent, User
from app.schemas import QRPayloadOut

router = APIRouter()


@router.get("/{pass_id}", response_model=QRPayloadOut)
def get_qr_for_pass(
    pass_id: UUID,
    session: Session = Depends(get_session),
    user: User = Depends(require_role("student")),
):
    p = session.get(Pass, pass_id)
    if not p:
        raise HTTPException(status_code=404, detail="Pass not found")
    if p.student_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if p.status != "approved":
        raise HTTPException(status_code=400, detail="Pass is not approved")
    if p.returned_at is not None:
        raise HTTPException(status_code=400, detail="Pass already completed")

    now = datetime.now(timezone.utc)
    expires_at = min(p.to_time.replace(tzinfo=timezone.utc), now + timedelta(minutes=QR_TOKEN_TTL_MINUTES))

    # Determine current phase based on existing successful scans
    existing_allows = session.exec(
        select(ScanEvent)
        .where(ScanEvent.pass_id == p.id, ScanEvent.result == "allow")
        .order_by(ScanEvent.scanned_at.asc())
    ).all()
    if not existing_allows:
        phase = "out"
    elif p.returned_at is None:
        phase = "in"
    else:
        # Already has an OUT+IN pair recorded
        raise HTTPException(status_code=400, detail="Pass already completed")

    # Create a one-time token entry
    jti = new_jti()
    nonce = new_nonce()
    token_row = QRToken(
        pass_id=p.id,
        jti=jti,
        nonce_hash=hash_nonce(nonce),
        expires_at=expires_at,
    )
    session.add(token_row)
    session.commit()
    session.refresh(token_row)

    # Signed JWT payload (what gets encoded into QR)
    token = create_access_token(
        {
            "typ": "gate_qr",
            "pass_id": str(p.id),
            "student_id": str(p.student_id),
            "jti": jti,
            "nonce": nonce,
            "phase": phase,
        },
        expires_minutes=int((expires_at - now).total_seconds() / 60) or 1,
    )
    return QRPayloadOut(token=token, expires_at=expires_at)


