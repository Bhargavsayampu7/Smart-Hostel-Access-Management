"""
ML Prediction Service for Hostel Access Control
Loads trained models and provides predictions
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import joblib
import pandas as pd
import numpy as np
import os
import random
import pickle

app = FastAPI(title="Hostel Access Control ML API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
MODELS_DIR = "models"
MODEL_VERSION = "v1.0"
MODEL_LOADED = False
MODEL_TYPE = "mock"

# New training pipeline artifacts
model = None
SCALER = None
LABEL_ENCODERS = None
FEATURE_NAMES = None

# Legacy pipeline artifacts (preprocessor + model)
legacy_preprocessor = None
legacy_model = None


def _load_new_pipeline():
    """Load XGBoost + scaler + label encoders saved by train_model.py."""
    global model, SCALER, LABEL_ENCODERS, FEATURE_NAMES, MODEL_LOADED, MODEL_TYPE

    model_path = os.path.join(MODELS_DIR, f"risk_model_{MODEL_VERSION}.joblib")
    scaler_path = os.path.join(MODELS_DIR, f"scaler_{MODEL_VERSION}.joblib")
    encoders_path = os.path.join(MODELS_DIR, f"label_encoders_{MODEL_VERSION}.pkl")
    features_path = os.path.join(MODELS_DIR, f"feature_names_{MODEL_VERSION}.txt")

    if not (os.path.exists(model_path) and os.path.exists(scaler_path) and os.path.exists(features_path)):
        return False

    model = joblib.load(model_path)
    SCALER = joblib.load(scaler_path)

    if os.path.exists(encoders_path):
        with open(encoders_path, "rb") as f:
            LABEL_ENCODERS = pickle.load(f)
    else:
        LABEL_ENCODERS = {}

    with open(features_path, "r") as f:
        FEATURE_NAMES = [line.strip() for line in f if line.strip()]

    MODEL_LOADED = True
    MODEL_TYPE = "XGBoost"
    print(f"✅ Loaded trained model: XGBoost ({os.path.basename(model_path)})")
    return True


def _load_legacy_pipeline():
    """Load legacy preprocessor + model artifacts if present."""
    global legacy_preprocessor, legacy_model, MODEL_LOADED, MODEL_TYPE

    try:
        preproc_path = os.path.join(MODELS_DIR, "preprocessor.joblib")
        if not os.path.exists(preproc_path):
            return False

        legacy_preprocessor = joblib.load(preproc_path)

        # Try to load best legacy model (XGBoost first, then fallback)
        if os.path.exists(os.path.join(MODELS_DIR, "xgb.joblib")):
            legacy_model = joblib.load(os.path.join(MODELS_DIR, "xgb.joblib"))
            MODEL_TYPE = "XGBoost"
        elif os.path.exists(os.path.join(MODELS_DIR, "rf.joblib")):
            legacy_model = joblib.load(os.path.join(MODELS_DIR, "rf.joblib"))
            MODEL_TYPE = "RandomForest"
        elif os.path.exists(os.path.join(MODELS_DIR, "logreg.joblib")):
            legacy_model = joblib.load(os.path.join(MODELS_DIR, "logreg.joblib"))
            MODEL_TYPE = "LogisticRegression"
        elif os.path.exists(os.path.join(MODELS_DIR, "hgb.joblib")):
            legacy_model = joblib.load(os.path.join(MODELS_DIR, "hgb.joblib"))
            MODEL_TYPE = "HistGradientBoosting"

        if legacy_model is not None:
            MODEL_LOADED = True
            print(f"✅ Loaded legacy trained model: {MODEL_TYPE}")
            return True

        print("⚠️  Legacy preprocessor loaded but no legacy model found")
        return False
    except Exception as e:
        print(f"⚠️  Could not load legacy trained models: {e}")
        return False


# Try to load models at startup – prefer new XGBoost pipeline, then legacy
try:
    if not _load_new_pipeline():
        if not _load_legacy_pipeline():
            print("⚠️  No trained models found, falling back to mock predictions")
except Exception as e:
    print(f"⚠️  Error during model loading: {e}")
    print("Falling back to mock predictions")

class MLRiskInput(BaseModel):
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

def prepare_input_data(input_data: MLRiskInput) -> pd.DataFrame:
    """Convert API input to dataframe matching training features"""
    data = {
        'age': input_data.age,
        'year': input_data.year,
        'gpa': input_data.gpa,
        'past_violations_30d': input_data.past_violations_30d,
        'past_violations_365d': input_data.past_violations_365d,
        'request_time_hour': input_data.request_time_hour,
        'requested_duration_hours': input_data.requested_duration_hours,
        'actual_return_delay_minutes': input_data.actual_return_delay_minutes,
        'parent_response_time_minutes': input_data.parent_response_time_minutes,
        'requests_last_7days': input_data.requests_last_7days,
        'hostel_block': input_data.hostel_block,
        'destination_risk': input_data.destination_risk,
        'parent_contact_reliable': input_data.parent_contact_reliable,
        'parent_action': input_data.parent_action,
        'emergency_flag': input_data.emergency_flag,
        'group_request': input_data.group_request,
        'weekend_request': input_data.weekend_request,
        'previous_no_show': input_data.previous_no_show
    }
    return pd.DataFrame([data])

def mock_prediction(input_data: MLRiskInput):
    """Fallback mock prediction"""
    base_score = 25
    base_score += input_data.past_violations_30d * 15
    base_score += input_data.parent_action * 10 if not input_data.parent_action else 0
    
    if input_data.weekend_request:
        base_score += 5
    
    score = base_score + random.uniform(-5, 5)
    score = max(0, min(100, score))
    
    if score <= 30:
        category = "low"
    elif score <= 60:
        category = "medium"
    else:
        category = "high"
    
    return {
        "risk_score": round(score, 2),
        "risk_category": category,
        "risk_probability": round(score / 100, 3),
        "model_version": "mock_v1.0",
        "model_type": "mock"
    }

@app.post("/predict")
async def predict_risk(input_data: MLRiskInput):
    """Predict risk using trained model or fallback to mock"""
    try:
        if MODEL_LOADED and model is not None:
            df = prepare_input_data(input_data)

            # Prefer new pipeline (XGBoost + scaler + encoders)
            if FEATURE_NAMES is not None and SCALER is not None:
                # Ensure correct column order
                X = df.reindex(columns=FEATURE_NAMES)

                # Apply label encoders to categorical columns, mapping unknowns to 0
                if LABEL_ENCODERS:
                    for col, le in LABEL_ENCODERS.items():
                        if col in X.columns:
                            mapping = {str(cls): idx for idx, cls in enumerate(le.classes_)}
                            X[col] = (
                                X[col]
                                .astype(str)
                                .map(mapping)
                                .fillna(0)
                            )

                # Scale features (scaler was fit on the full numeric matrix)
                X_scaled = SCALER.transform(X)

                # Predict probability
                prob = float(model.predict_proba(X_scaled)[0, 1])
            # Fallback to legacy preprocessor + model if available
            elif legacy_preprocessor is not None and legacy_model is not None:
                X_prep = legacy_preprocessor.transform(df)
                prob = float(legacy_model.predict_proba(X_prep)[0, 1])
            else:
                # No usable trained pipeline, go to mock
                return mock_prediction(input_data)

            score = round(prob * 100, 2)
            
            # Get category
            if score <= 30:
                category = "low"
            elif score <= 60:
                category = "medium"
            else:
                category = "high"
            
            # Get feature importance if available
            top_features = []
            if hasattr(model, "feature_importances_"):
                importances = model.feature_importances_
                if FEATURE_NAMES is not None and len(FEATURE_NAMES) == len(importances):
                    top_indices = np.argsort(importances)[-5:][::-1]
                    top_features = [
                        {
                            "feature": FEATURE_NAMES[i],
                            "importance": float(importances[i]),
                        }
                        for i in top_indices
                    ]
            
            return {
                "risk_score": score,
                "risk_category": category,
                "risk_probability": round(prob, 4),
                "model_version": "trained_v1.0",
                "model_type": MODEL_TYPE,
                "top_features": top_features if top_features else []
            }
        else:
            # Fallback to mock
            return mock_prediction(input_data)
            
    except Exception as e:
        print(f"Prediction error: {e}")
        import traceback
        traceback.print_exc()
        return mock_prediction(input_data)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_version": f"trained_{MODEL_VERSION}" if MODEL_LOADED else "mock_v1.0",
        "model_type": MODEL_TYPE if MODEL_LOADED else "mock",
        "model_loaded": MODEL_LOADED
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Hostel Access Control ML API",
        "version": "1.0.0",
        "status": "running",
        "model_status": "trained" if MODEL_LOADED else "mock"
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting ML Prediction Service on http://localhost:8000")
    if MODEL_LOADED:
        print(f"   Using trained model: {MODEL_TYPE}")
    else:
        print("   Using mock model (train models first)")
    uvicorn.run(app, host="0.0.0.0", port=8000)