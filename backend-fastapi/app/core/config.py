import os


def get_env(key: str, default: str | None = None) -> str | None:
    value = os.getenv(key)
    if value is None or value == "":
        return default
    return value


# Check for DATABASE_URL first, then POSTGRES_URL (Vercel/Neon compatibility)
# Different platforms use different environment variable names
DATABASE_URL = (
    get_env("DATABASE_URL") or 
    get_env("POSTGRES_URL") or 
    get_env("POSTGRESQL_URL") or
    "sqlite:///./dev.db"
)

# Render/Railway may provide postgres:// instead of postgresql://
# SQLAlchemy 2.0+ requires postgresql:// with driver specified
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL and DATABASE_URL.startswith("postgresql://") and "+psycopg" not in DATABASE_URL:
    # Ensure psycopg driver is specified for PostgreSQL connections
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
JWT_SECRET = get_env("JWT_SECRET", "change-me")
JWT_EXPIRE_MINUTES = int(get_env("JWT_EXPIRE_MINUTES", "10080"))  # 7 days

QR_TOKEN_TTL_MINUTES = int(get_env("QR_TOKEN_TTL_MINUTES", "15"))

# Optional ML service
ML_API_URL = get_env("ML_API_URL", "http://localhost:8000")
USE_ML_PREDICTION = get_env("USE_ML_PREDICTION", "false").lower() == "true"


