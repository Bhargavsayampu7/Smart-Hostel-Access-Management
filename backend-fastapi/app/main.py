from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ── Import ALL models before init_db so SQLModel.metadata knows every table ──
import app.models  # noqa: F401

from app.db.session import init_db
from app.routers import auth, passes, approvals, qr, scan, location
from app.routers import requests_compat, students_compat, parents_compat, admin_compat
from app.routers import risk


# ── Lifespan: create DB tables on startup ────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create all SQLModel tables before the first request (idempotent)."""
    try:
        init_db()
        print("[startup] DB tables ensured ✓")
    except Exception as exc:
        print(f"[startup] WARNING: init_db failed: {exc}")
    yield  # app runs here


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Hostel Outpass Platform API",
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Open to all origins — public demo backend on Render / any CI environment.
# allow_credentials MUST be False when allow_origins=["*"].
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# ── Global error handler: inject CORS on 500 so browser shows the real error ──
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        },
    )


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/health")
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "hostel-backend", "version": "0.1.0"}


app.include_router(auth.router,      prefix="/api/auth",     tags=["auth"])
app.include_router(passes.router,    prefix="/api/passes",   tags=["passes"])
app.include_router(approvals.router, prefix="/api/approvals",tags=["approvals"])
app.include_router(qr.router,        prefix="/api/qr",       tags=["qr"])
app.include_router(scan.router,      prefix="/api/scan",     tags=["scan"])
app.include_router(location.router,  prefix="/api/location", tags=["location"])
app.include_router(risk.router,      prefix="/api/pass",     tags=["risk"])

# Compat endpoints matching the React front-end's expected paths
app.include_router(requests_compat.router, prefix="/api/requests", tags=["compat:requests"])
app.include_router(students_compat.router, prefix="/api/students", tags=["compat:students"])
app.include_router(parents_compat.router,  prefix="/api/parents",  tags=["compat:parents"])
app.include_router(admin_compat.router,    prefix="/api/admin",    tags=["compat:admin"])
