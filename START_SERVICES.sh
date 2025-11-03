#!/bin/bash

echo "🚀 Starting Complete System"
echo "============================"

# Kill any existing processes
echo "Cleaning up old processes..."
lsof -ti:5001 | xargs kill -9 2>/dev/null
lsof -ti:8000 | xargs kill -9 2>/dev/null
sleep 2

# Start ML Service in background
echo ""
echo "Starting ML Service..."
cd ml-service
source venv/bin/activate
python app.py > ../ml-service.log 2>&1 &
ML_PID=$!
cd ..

# Wait for ML service to start
echo "Waiting for ML service to start..."
sleep 5

# Check ML service
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ ML service running on http://localhost:8000"
else
    echo "⚠️  ML service may not have started properly"
    echo "Check ml-service.log for errors"
fi

# Start Backend
echo ""
echo "Starting Backend..."
cd backend
export USE_ML_PREDICTION=true
export ML_API_URL=http://localhost:8000
npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 3

# Check backend
if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
    echo "✅ Backend running on http://localhost:5001"
else
    echo "⚠️  Backend may not have started properly"
    echo "Check backend.log for errors"
fi

echo ""
echo "=================================================="
echo "🎉 System Started!"
echo "=================================================="
echo ""
echo "ML Service:    http://localhost:8000"
echo "Backend:       http://localhost:5001"
echo "Application:   http://localhost:5001 (open in browser)"
echo ""
echo "Logs:"
echo "  ML Service:  tail -f ml-service.log"
echo "  Backend:     tail -f backend.log"
echo ""
echo "To stop:"
echo "  kill $ML_PID $BACKEND_PID"
echo ""
echo "=================================================="
