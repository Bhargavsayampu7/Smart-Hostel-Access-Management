from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field, Relationship, Column
from sqlalchemy import String, Text, DateTime, Numeric


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    role: str = Field(sa_column=Column(String(20), nullable=False))
    name: Optional[str] = Field(default=None, sa_column=Column(String(120)))
    email: str = Field(sa_column=Column(String(254), nullable=False, unique=True, index=True))
    phone: Optional[str] = Field(default=None, sa_column=Column(String(30)))
    password_hash: str = Field(sa_column=Column(String(255), nullable=False))
    status: str = Field(default="active", sa_column=Column(String(20), nullable=False))

    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(), nullable=False))
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(), nullable=False))


class Student(SQLModel, table=True):
    __tablename__ = "students"

    user_id: UUID = Field(foreign_key="users.id", primary_key=True)
    roll_no: Optional[str] = Field(default=None, sa_column=Column(String(40)))
    hostel_name: Optional[str] = Field(default=None, sa_column=Column(String(80)))
    room_no: Optional[str] = Field(default=None, sa_column=Column(String(40)))
    branch: Optional[str] = Field(default=None, sa_column=Column(String(80)))
    semester: Optional[int] = Field(default=None)


class Parent(SQLModel, table=True):
    __tablename__ = "parents"

    user_id: UUID = Field(foreign_key="users.id", primary_key=True)
    student_id: UUID = Field(foreign_key="users.id", index=True)
    relationship: Optional[str] = Field(default=None, sa_column=Column(String(40)))


class Pass(SQLModel, table=True):
    __tablename__ = "passes"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    student_id: UUID = Field(foreign_key="users.id", index=True)

    pass_type: str = Field(sa_column=Column(String(20), nullable=False))
    destination: str = Field(sa_column=Column(String(120), nullable=False))
    reason: str = Field(sa_column=Column(Text(), nullable=False))
    emergency_contact: str = Field(sa_column=Column(String(30), nullable=False))

    from_time: datetime = Field(sa_column=Column(DateTime(), nullable=False))
    to_time: datetime = Field(sa_column=Column(DateTime(), nullable=False))

    status: str = Field(sa_column=Column(String(30), nullable=False, index=True), default="pending_parent")

    risk_score: Optional[float] = Field(default=None, sa_column=Column(Numeric(6, 2)))
    risk_category: Optional[str] = Field(default=None, sa_column=Column(String(10)))

    parent_comments: Optional[str] = Field(default=None, sa_column=Column(Text()))
    admin_comments: Optional[str] = Field(default=None, sa_column=Column(Text()))
    parent_decided_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime()))
    admin_decided_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime()))

    returned_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime()))

    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(), nullable=False))
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(), nullable=False))


class Approval(SQLModel, table=True):
    __tablename__ = "approvals"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    pass_id: UUID = Field(foreign_key="passes.id", index=True)
    approved_by: UUID = Field(foreign_key="users.id")
    role: str = Field(sa_column=Column(String(20), nullable=False))
    decision: str = Field(sa_column=Column(String(10), nullable=False))  # approve|reject
    comments: Optional[str] = Field(default=None, sa_column=Column(Text()))
    decided_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(), nullable=False))


class QRToken(SQLModel, table=True):
    __tablename__ = "qr_tokens"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    pass_id: UUID = Field(foreign_key="passes.id", index=True)
    jti: str = Field(sa_column=Column(String(64), nullable=False, unique=True))
    nonce_hash: str = Field(sa_column=Column(String(128), nullable=False))
    expires_at: datetime = Field(sa_column=Column(DateTime(), nullable=False, index=True))
    used_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime()))
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(), nullable=False))


class ScanEvent(SQLModel, table=True):
    __tablename__ = "scan_events"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    pass_id: Optional[UUID] = Field(default=None, foreign_key="passes.id", index=True)
    gate_id: str = Field(sa_column=Column(String(60), nullable=False))
    result: str = Field(sa_column=Column(String(10), nullable=False))  # allow|deny
    reason: Optional[str] = Field(default=None, sa_column=Column(String(120)))
    scanned_by: Optional[UUID] = Field(default=None, foreign_key="users.id")
    scanned_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(), nullable=False))


class LocationPoint(SQLModel, table=True):
    __tablename__ = "location_points"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    pass_id: UUID = Field(foreign_key="passes.id", index=True)
    lat: float
    lon: float
    accuracy: Optional[float] = None
    recorded_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime(), nullable=False, index=True))


