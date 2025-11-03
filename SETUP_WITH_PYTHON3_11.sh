#!/bin/bash

echo "🚀 Setting up with Python 3.11"
echo "============================================"
echo ""

# Create virtual environment with Python 3.11
echo "🐍 Creating Python 3.11 virtual environment..."
cd ml-service

if [ -d "venv" ]; then
    echo "⚠️  Removing old venv..."
    rm -rf venv
fi

python3.11 -m venv venv
echo "✅ Virtual environment created"

# Activate virtual environment
echo ""
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo ""
echo "📦 Upgrading pip..."
pip install --upgrade pip --quiet

# Install dependencies
echo ""
echo "📦 Installing Python dependencies..."
echo "This may take a few minutes..."
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "❌ Installation failed"
    exit 1
fi

echo "✅ Dependencies installed"

# Convert Excel to CSV
echo ""
echo "📊 Converting Excel to CSV..."
python convert_excel.py

if [ $? -ne 0 ]; then
    echo "❌ Conversion failed"
    exit 1
fi

echo ""
echo "🤖 Training models..."
echo "This will take 5-10 minutes..."
python train_your_model.py

if [ $? -ne 0 ]; then
    echo "❌ Training failed"
    exit 1
fi

echo ""
echo "✅✅✅ SETUP COMPLETE! ✅✅✅"
echo ""
echo "📁 Generated files:"
ls -lh models/
ls -lh plots/ 2>/dev/null
echo ""
echo "🚀 To start ML service:"
echo "   cd ml-service"
echo "   source venv/bin/activate"
echo "   python app.py"
echo ""
echo "🚀 To start backend:"
echo "   cd backend"
echo "   USE_ML_PREDICTION=true npm start"
echo ""
cd ..
