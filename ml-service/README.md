# ML Risk Prediction Service

FastAPI microservice for risk prediction in the Hostel Access Control System.

## Quick Start

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run the service
python app.py

# Test the service
curl http://localhost:8000/health
```

### Docker

```bash
# Build image
docker build -t hostel-ml-service .

# Run container
docker run -p 8000:8000 hostel-ml-service
```

## API Endpoints

### POST /predict
Predict risk score for a request

**Request:**
```json
{
  "request_type": "outpass",
  "destination": "Movie",
  "past_violations_30d": 0,
  "late_returns_30d": 0,
  "rejection_rate": 0.0,
  "request_frequency_30d": 2
}
```

**Response:**
```json
{
  "risk_score": 27.5,
  "risk_category": "low",
  "risk_probability": 0.275,
  "model_version": "mock_v1.0",
  "top_features": [
    {"feature": "past_violations_30d", "importance": 0.15},
    {"feature": "late_returns_30d", "importance": 0.10}
  ]
}
```

### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "model_version": "mock_v1.0",
  "model_loaded": true
}
```

## Next Steps

1. **Collect Data:** Export historical requests from database
2. **Train Model:** Use XGBoost or similar ML algorithm
3. **Deploy:** Replace mock model with trained model
4. **Monitor:** Track prediction accuracy and model performance

See `../ML_INTEGRATION_GUIDE.md` for detailed instructions.
