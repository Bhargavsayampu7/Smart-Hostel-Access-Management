from datetime import datetime, timedelta, timezone
from typing import Any
import secrets
import hashlib

from jose import jwt
from passlib.context import CryptContext

from app.core.config import JWT_SECRET, JWT_EXPIRE_MINUTES

# Use a pure-Python, battle-tested hash to avoid platform-specific bcrypt issues
# and the 72-byte password length limitation.
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(claims: dict[str, Any], expires_minutes: int | None = None) -> str:
    minutes = JWT_EXPIRE_MINUTES if expires_minutes is None else expires_minutes
    now = datetime.now(timezone.utc)
    payload = dict(claims)
    payload["iat"] = int(now.timestamp())
    payload["exp"] = int((now + timedelta(minutes=minutes)).timestamp())
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])


def new_jti() -> str:
    return secrets.token_urlsafe(24)


def new_nonce() -> str:
    return secrets.token_urlsafe(24)


def hash_nonce(nonce: str) -> str:
    # Stable hash for storage (no need for slow hashing; nonce is random+short lived)
    return hashlib.sha256(nonce.encode("utf-8")).hexdigest()


