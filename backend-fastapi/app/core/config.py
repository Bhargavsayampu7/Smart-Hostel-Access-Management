import os


def get_env(key: str, default: str | None = None) -> str | None:
    value = os.getenv(key)
    if value is None or value == "":
        return default
    return value


# Check for DATABASE_URL first, then POSTGRES_URL (Vercel/Neon compatibility)
_raw = get_env("DATABASE_URL") or get_env("POSTGRES_URL", "sqlite:///./dev.db")
# Use psycopg3 driver for PostgreSQL (Neon often gives postgresql://)
# SQLAlchemy 2.0+ uses psycopg3 when URL is postgresql+psycopg://
if _raw.startswith("postgresql://") and not _raw.startswith("postgresql+"):
    # Convert postgresql:// to postgresql+psycopg:// for psycopg3
    _raw = _raw.replace("postgresql://", "postgresql+psycopg://", 1)
elif _raw.startswith("postgresql+psycopg2"):
    # If somehow psycopg2 is specified, convert to psycopg3
    _raw = _raw.replace("postgresql+psycopg2://", "postgresql+psycopg://", 1)
DATABASE_URL = _raw
JWT_SECRET = get_env("JWT_SECRET", "change-me")
JWT_EXPIRE_MINUTES = int(get_env("JWT_EXPIRE_MINUTES", "10080"))  # 7 days

QR_TOKEN_TTL_MINUTES = int(get_env("QR_TOKEN_TTL_MINUTES", "15"))

# Optional ML service
ML_API_URL = get_env("ML_API_URL", "http://localhost:8000")
USE_ML_PREDICTION = get_env("USE_ML_PREDICTION", "false").lower() == "true"


