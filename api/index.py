"""
Vercel entrypoint for the FastAPI backend.

The Python runtime on Vercel can run ASGI apps directly.
We just need to expose a module-level `app` variable.
"""

import os
import sys

# Add backend-fastapi to Python path so `app.main` can be imported
backend_path = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "backend-fastapi")
)
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Best-effort DB initialization (tables only). Demo users are seeded lazily
# inside the auth router on first login.
try:
    from app.db.session import init_db

    init_db()
except Exception as e:  # pragma: no cover - defensive log only
    print(f"[DB Init] Note: {e}")
    try:
        import traceback

        traceback.print_exc()
    except Exception:
        pass

# Expose the FastAPI ASGI application for Vercel's Python runtime
from app.main import app  # noqa: E402,F401

