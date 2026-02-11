from __future__ import annotations

import os
from typing import Any, Dict

import httpx


ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "http://localhost:8000")


class MLRiskServiceError(Exception):
    """Raised when the ML risk service call fails."""


def predict_risk(features: Dict[str, Any]) -> Dict[str, Any]:
    """
    Call the external ML service to obtain a risk prediction.

    `features` should already match the `MLRiskInput` schema expected by the
    ml-service FastAPI (`ml-service/app.py`).
    """
    url = f"{ML_SERVICE_URL.rstrip('/')}/predict"

    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.post(url, json=features)
            response.raise_for_status()
            data = response.json()
    except Exception as exc:  # noqa: BLE001
        # For now, don't break the core pass flow if ML is down.
        # Log-friendly message and return a safe fallback.
        print(f"[ML CLIENT] Error calling {url}: {exc}")  # noqa: T201
        return {
            "risk_score": 0.0,
            "risk_category": "low",
            "risk_probability": 0.0,
            "model_type": "fallback",
        }

    # Ensure minimal expected keys exist
    return {
        "risk_score": data.get("risk_score", 0.0),
        "risk_category": data.get("risk_category", "low"),
        "risk_probability": data.get("risk_probability", 0.0),
        "model_type": data.get("model_type", data.get("model_type", "unknown")),
        "raw": data,
    }

