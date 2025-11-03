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
MODEL_LOADED = False
MODEL_TYPE = "mock"
preprocessor = None
model = None

# Try to load trained models at startup
try:
    if os.path.exists(f"{MODELS_DIR}/preprocessor.joblib"):
        preprocessor = joblib.load(f"{MODELS_DIR}/preprocessor.joblib")
        
        # Try to load best model (XGBoost first, then fallback)
        if os.path.exists(f"{MODELS_DIR}/xgb.joblib"):
            model = joblib.load(f"{MODELS_DIR}/xgb.joblib")
            MODEL_TYPE = "XGBoost"
        elif os.path.exists(f"{MODELS_DIR}/rf.joblib"):
            model = joblib.load(f"{MODELS_DIR}/rf.joblib")
            MODEL_TYPE = "RandomForest"
        elif os.path.exists(f"{MODELS_DIR}/logreg.joblib"):
            model = joblib.load(f"{MODELS_DIR}/logreg.joblib")
            MODEL_TYPE = "LogisticRegression"
        elif os.path.exists(f"{MODELS_DIR}/hgb.joblib"):
            model = joblib.load(f"{MODELS_DIR}/hgb.joblib")
            MODEL_TYPE = "HistGradientBoosting"
        
        if model is not None:
            MODEL_LOADED = True
            print(f"✅ Loaded trained model: {MODEL_TYPE}")
        else:
            print("⚠️  Preprocessor loaded but no model found")
except Exception as e:
    print(f"⚠️  Could not load trained models: {e}")
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
        if MODEL_LOADED and model is not None and preprocessor is not None:
            # Use trained model
            df = prepare_input_data(input_data)
            
            # Preprocess
            X_prep = preprocessor.transform(df)
            
            # Predict probability
            prob = model.predict_proba(X_prep)[0, 1]
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
            if hasattr(model, 'feature_importances_'):
                importances = model.feature_importances_
                top_indices = np.argsort(importances)[-5:][::-1]
                top_features = [
                    {"feature": f"feature_{i}", "importance": float(importances[i])}
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
        "model_version": "trained_v1.0" if MODEL_LOADED else "mock_v1.0",
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