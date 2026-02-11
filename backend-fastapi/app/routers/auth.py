from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.db.session import get_session, init_db
from app.models import User, Parent
from app.schemas import RegisterIn, LoginIn, TokenResponse, UserOut
from app.core.security import hash_password, verify_password, create_access_token
from app.deps import get_current_user
from app.models import Student

router = APIRouter()


@router.on_event("startup")
def _startup():
    # dev convenience
    init_db()


@router.on_event("startup")
def _seed_demo():
    # Idempotent seed, safe for dev.
    from app.db.session import engine
    from sqlmodel import Session as DBSession

    with DBSession(engine) as session:
        any_user = session.exec(select(User).limit(1)).first()
        if any_user:
            return

        # Seed demo users matching the frontend mock credentials
        student = User(
            role="student",
            name="Demo Student",
            email="student@test.com",
            phone="+91-9000000001",
            password_hash=hash_password("student123"),
        )
        parent = User(
            role="parent",
            name="Demo Parent",
            email="parent@test.com",
            phone="+91-9000000002",
            password_hash=hash_password("parent123"),
        )
        admin = User(
            role="admin",
            name="Demo Warden",
            email="warden@test.com",
            phone="+91-9000000003",
            password_hash=hash_password("warden123"),
        )
        security = User(
            role="security",
            name="Demo Security",
            email="security@test.com",
            phone="+91-9000000004",
            password_hash=hash_password("security123"),
        )

        session.add(student)
        session.add(parent)
        session.add(admin)
        session.add(security)
        session.commit()
        session.refresh(student)
        session.refresh(parent)

        session.add(Parent(user_id=parent.id, student_id=student.id, relationship="Parent"))
        session.add(
            Student(
                user_id=student.id,
                roll_no="S-001",
                hostel_name="Block A",
                room_no="A-101",
                branch="CSE",
                semester=3,
            )
        )
        session.commit()


@router.post("/register", response_model=UserOut)
def register(payload: RegisterIn, session: Session = Depends(get_session)):
    existing = session.exec(select(User).where(User.email == payload.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        role=payload.role,
        name=payload.name,
        email=str(payload.email),
        phone=payload.phone,
        password_hash=hash_password(payload.password),
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    # optional parent linkage
    if payload.role == "parent" and payload.student_id:
        parent = Parent(user_id=user.id, student_id=payload.student_id)
        session.add(parent)
        session.commit()

    return UserOut.model_validate(user)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginIn, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == str(payload.email))).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if user.status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is not active")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user)


