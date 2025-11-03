#!/bin/bash

echo "🚀 Complete Setup Script for ML Integration"
echo "=============================================="
echo ""

# Check Python version
echo "📋 Checking Python..."
python3 --version

# Create virtual environment
echo ""
echo "🐍 Creating Python virtual environment..."
if [ -d "ml-service/venv" ]; then
    echo "✅ Virtual environment already exists"
else
    python3 -m venv ml-service/venv
    echo "✅ Virtual environment created"
fi

# Activate virtual environment
echo ""
echo "🔄 Activating virtual environment..."
source ml-service/venv/bin/activate

# Install dependencies
echo ""
echo "📦 Installing Python dependencies..."
cd ml-service
pip install -r requirements.txt --quiet

echo "✅ Dependencies installed"

# Convert Excel to CSV
echo ""
echo "📊 Converting Excel to CSV..."
python convert_excel.py

if [ $? -ne 0 ]; then
    echo "❌ Conversion failed. Please check the error above."
    exit 1
fi

echo ""
echo "🤖 Training models..."
echo "This will take 5-10 minutes..."
python train_your_model.py

if [ $? -ne 0 ]; then
    echo "❌ Training failed. Please check the error above."
    exit 1
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📁 Generated files:"
ls -lh models/
ls -lh plots/ 2>/dev/null || echo "   (plots will be created during training)"
echo ""
echo "🎯 Next steps:"
echo "   Terminal 1: cd ml-service && source venv/bin/activate && python app.py"
echo "   Terminal 2: cd backend && USE_ML_PREDICTION=true npm start"
echo ""
echo "📝 Note: Always activate venv before running Python scripts"
echo "   source ml-service/venv/bin/activate"
echo ""