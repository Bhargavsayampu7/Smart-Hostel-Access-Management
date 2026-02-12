from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from typing import List

from app.routers import auth, passes, approvals, qr, scan, location
from app.routers import requests_compat, students_compat, parents_compat, admin_compat
from app.routers import risk


app = FastAPI(title="Hostel Outpass Platform API", version="0.1.0")

# Environment-based CORS configuration
cors_origins_str = os.getenv("CORS_ORIGINS", "")
if cors_origins_str:
    # Production: use explicit origins from environment
    cors_origins: List[str] = [origin.strip() for origin in cors_origins_str.split(",")]
else:
    # Development: allow common local development ports
    cors_origins = ["http://localhost:5173", "http://localhost:3000", "http://localhost:5002"]
    # In production, CORS_ORIGINS MUST be set explicitly
    if os.getenv("ENVIRONMENT") == "production":
        print("WARNING: CORS_ORIGINS not set in production. Using empty list.")
        cors_origins = []

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
@app.get("/api/health")
def health():
    """Health check endpoint - available at both /health and /api/health for compatibility"""
    return {"status": "ok", "service": "hostel-backend", "version": "0.1.0"}



app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(passes.router, prefix="/api/passes", tags=["passes"])
app.include_router(approvals.router, prefix="/api/approvals", tags=["approvals"])
app.include_router(qr.router, prefix="/api/qr", tags=["qr"])
app.include_router(scan.router, prefix="/api/scan", tags=["scan"])
app.include_router(location.router, prefix="/api/location", tags=["location"])
app.include_router(risk.router, prefix="/api/pass", tags=["risk"])

# Compatibility endpoints for the existing React pages (mirrors old Node API paths)
app.include_router(requests_compat.router, prefix="/api/requests", tags=["compat:requests"])
app.include_router(students_compat.router, prefix="/api/students", tags=["compat:students"])
app.include_router(parents_compat.router, prefix="/api/parents", tags=["compat:parents"])
app.include_router(admin_compat.router, prefix="/api/admin", tags=["compat:admin"])


