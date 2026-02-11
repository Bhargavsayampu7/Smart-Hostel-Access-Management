from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, ConfigDict


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    role: str
    name: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None


class RegisterIn(BaseModel):
    role: str = Field(pattern="^(student|parent|admin|security)$")
    name: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    password: str = Field(min_length=6)

    # parent linkage (optional during initial bootstrap)
    student_id: Optional[UUID] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class PassCreateIn(BaseModel):
    pass_type: str = Field(pattern="^(outpass|homepass|emergency)$")
    destination: str
    reason: str
    emergency_contact: str
    from_time: datetime
    to_time: datetime


class PassOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    student_id: UUID
    pass_type: str
    destination: str
    reason: str
    emergency_contact: str
    from_time: datetime
    to_time: datetime
    status: str
    risk_score: Optional[float] = None
    risk_category: Optional[str] = None
    created_at: datetime


class ApproveIn(BaseModel):
    approved: bool
    comments: Optional[str] = None


class QRPayloadOut(BaseModel):
    token: str
    expires_at: datetime


class ScanIn(BaseModel):
    token: str
    gate_id: str


class ScanOut(BaseModel):
    result: str  # allow|deny
    reason: Optional[str] = None
    pass_id: Optional[UUID] = None


class LocationIn(BaseModel):
    pass_id: UUID
    lat: float
    lon: float
    accuracy: Optional[float] = None
    recorded_at: Optional[datetime] = None


class LocationOut(BaseModel):
    pass_id: UUID
    lat: float
    lon: float
    accuracy: Optional[float] = None
    recorded_at: datetime


