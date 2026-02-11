import os


def get_env(key: str, default: str | None = None) -> str | None:
    value = os.getenv(key)
    if value is None or value == "":
        return default
    return value


DATABASE_URL = get_env("DATABASE_URL", "sqlite:///./dev.db")
JWT_SECRET = get_env("JWT_SECRET", "change-me")
JWT_EXPIRE_MINUTES = int(get_env("JWT_EXPIRE_MINUTES", "10080"))  # 7 days

QR_TOKEN_TTL_MINUTES = int(get_env("QR_TOKEN_TTL_MINUTES", "15"))

# Optional ML service
ML_API_URL = get_env("ML_API_URL", "http://localhost:8000")
USE_ML_PREDICTION = get_env("USE_ML_PREDICTION", "false").lower() == "true"


