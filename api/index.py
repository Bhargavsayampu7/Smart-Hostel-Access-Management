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

# Expose the FastAPI ASGI application for Vercel's Python runtime
# Database initialization happens lazily on first request
from app.main import app  # noqa: E402,F401
