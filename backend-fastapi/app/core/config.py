import os


def get_env(key: str, default: str | None = None) -> str | None:
    value = os.getenv(key)
    if value is None or value == "":
        return default
    return value


# Check for DATABASE_URL first, then POSTGRES_URL (Vercel/Neon compatibility)
_raw = get_env("DATABASE_URL") or get_env("POSTGRES_URL", "sqlite:///./dev.db")
# Ensure PostgreSQL URLs use psycopg2 driver (most compatible with SQLAlchemy 2.0)
# Neon/Vercel gives postgresql:// which SQLAlchemy interprets as psycopg2
if _raw.startswith("postgresql://") and not _raw.startswith("postgresql+"):
    # Keep as postgresql:// (SQLAlchemy will use psycopg2)
    pass
elif _raw.startswith("postgresql+psycopg://"):
    # Convert psycopg3 URL to psycopg2 for compatibility
    _raw = _raw.replace("postgresql+psycopg://", "postgresql+psycopg2://", 1)
DATABASE_URL = _raw
JWT_SECRET = get_env("JWT_SECRET", "change-me")
JWT_EXPIRE_MINUTES = int(get_env("JWT_EXPIRE_MINUTES", "10080"))  # 7 days

QR_TOKEN_TTL_MINUTES = int(get_env("QR_TOKEN_TTL_MINUTES", "15"))

# Optional ML service
ML_API_URL = get_env("ML_API_URL", "http://localhost:8000")
USE_ML_PREDICTION = get_env("USE_ML_PREDICTION", "false").lower() == "true"


