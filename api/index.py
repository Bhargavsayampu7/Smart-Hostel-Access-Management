"""
Vercel serverless function wrapper for FastAPI backend.
This file handles all /api/* routes on Vercel.
"""
import sys
import os

# Add backend-fastapi to Python path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend-fastapi'))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Initialize database on first import (for Vercel serverless)
# Since Mangum disables lifespan events, we need to initialize manually
try:
    from app.db.session import init_db
    # Initialize database tables (idempotent)
    init_db()
except Exception as e:
    # Log but don't fail - database might already be initialized
    print(f"[DB Init] Note: {e}")

# Import FastAPI app and wrap with Mangum
from mangum import Mangum
from app.main import app

# Wrap FastAPI app with Mangum for AWS Lambda/Vercel compatibility
# lifespan="off" disables FastAPI lifespan events (not supported in serverless)
handler = Mangum(app, lifespan="off")
