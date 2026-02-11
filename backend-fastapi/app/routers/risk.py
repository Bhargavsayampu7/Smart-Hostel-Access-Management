from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.deps import require_role
from app.models import User
from app.services.ml_client import predict_risk


router = APIRouter()


class MLRiskIn(BaseModel):
    # Core features
    age: int
    year: int
    gpa: float
    hostel_block: str
    parent_contact_reliable: int
    past_violations_30d: int
    past_violations_365d: int

    # Request context
    request_time_hour: int
    requested_duration_hours: float
    actual_return_delay_minutes: float
    parent_response_time_minutes: float
    parent_action: int
    destination_risk: str
    emergency_flag: int
    group_request: int
    weekend_request: int
    previous_no_show: int
    requests_last_7days: int


@router.post("/risk")
def compute_risk(
    payload: MLRiskIn,
    user: User = Depends(require_role("student")),
):
    """
    Forward risk features to the ML microservice and return its prediction.

    The payload shape mirrors ml-service/app.py:MLRiskInput. This endpoint does
    not apply any heuristic scoring; it simply delegates to the ML service.
    """
    ml_result = predict_risk(payload.model_dump())

    return {
        "risk_score": ml_result.get("risk_score"),
        "risk_category": ml_result.get("risk_category"),
        "risk_probability": ml_result.get("risk_probability"),
        "model_type": ml_result.get("model_type"),
        "raw": ml_result.get("raw"),
    }

