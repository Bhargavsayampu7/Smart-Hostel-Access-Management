# Smart Hostel Access Control System + ML Risk Prediction 🏠🤖

> **A complete hostel outpass management system with Machine Learning-based risk prediction**

[![Status](https://img.shields.io/badge/status-production%20ready-green)]()
[![ML](https://img.shields.io/badge/ML-enabled-blue)]()
[![Docker](https://img.shields.io/badge/Docker-ready-blue)]()

## 🎯 Features

### Core System
- ✅ **Student Portal** - Create outpass requests, manage profile, view QR codes
- ✅ **Parent Portal** - Review and approve student requests
- ✅ **Admin Dashboard** - Final approval, violation management, analytics
- ✅ **QR Code Generation** - Automatic QR codes for approved requests
- ✅ **JWT Authentication** - Secure authentication
- ✅ **MongoDB Database** - Persistent data storage

### ML Risk Prediction (NEW!)
- ✅ **Machine Learning API** - Python FastAPI microservice
- ✅ **Hybrid Approach** - ML predictions with rule-based fallback
- ✅ **Model Agnostic** - Easy to swap models
- ✅ **Feature Engineering** - Rich feature set for predictions
- ✅ **Explainability** - SHAP support for feature importance
- ✅ **Dockerized** - Full containerization

---

## 🚀 Quick Start

### Option 1: Just Test (10 min)
```bash
# Start everything
docker-compose up

# Or manually:
cd backend && npm start
cd ml-service && python app.py
```

### Option 2: Train & Deploy (30 min)
```bash
# See QUICK_TRAIN_AND_DEPLOY.md for full steps
# Or: INTEGRATE_YOUR_DATA.md if you have your dataset
```

---

## 📖 Documentation Guide

| What You Want | Read This |
|---------------|-----------|
| **See it work quickly** | `README_QUICKSTART.md` |
| **Integrate your dataset** | `INTEGRATE_YOUR_DATA.md` |
| **Train & deploy in 15 min** | `QUICK_TRAIN_AND_DEPLOY.md` |
| **Understand architecture** | `ML_INTEGRATION_GUIDE.md` |
| **Plan next steps** | `NEXT_STEPS_ROADMAP.md` |
| **Visual overview** | `VISUAL_ROADMAP.md` |
| **Complete summary** | `SUMMARY_README.md` |
| **Starting from scratch** | `START_HERE.md` |

---

## 🛠️ Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript (Vanilla)
- Responsive design with modern UI

**Backend:**
- Node.js with Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing

**ML Service:**
- Python 3.10+
- FastAPI
- XGBoost
- scikit-learn
- SHAP (optional)

**Deployment:**
- Docker & Docker Compose
- MongoDB Atlas (optional)

---

## 📁 Project Structure

```
final-hostel-system.zip/
├── 📘 Quick Reference
│   ├── START_HERE.md               → Start here first!
│   ├── README_QUICKSTART.md        → Ultra-quick guide
│   ├── YOUR_NEXT_STEPS.md          → What to do next
│   └── VISUAL_ROADMAP.md           → Visual overview
│
├── 🤖 ML Integration
│   ├── INTEGRATE_YOUR_DATA.md      → Use your dataset
│   ├── QUICK_TRAIN_AND_DEPLOY.md   → Fast deployment
│   ├── ML_INTEGRATION_GUIDE.md     → Complete guide
│   └── NEXT_STEPS_ROADMAP.md       → Planning guide
│
├── 🐍 ML Service
│   ├── ml-service/
│   │   ├── app.py                  → FastAPI service
│   │   ├── train_model.py          → Model training
│   │   ├── evaluate_model.py       → Evaluation + ROC
│   │   ├── requirements.txt        → Dependencies
│   │   └── data/                   → Your dataset here
│   │
├── 🔧 Backend
│   ├── backend/
│   │   ├── utils/
│   │   │   ├── mlRiskPredictor.js  → ML client
│   │   │   └── riskCalculator.js   → Risk calculation
│   │   └── models/                 → MongoDB models
│   │
├── 🐳 Deployment
│   ├── docker-compose.yml          → Full stack
│   ├── backend/Dockerfile          → Backend container
│   └── ml-service/Dockerfile       → ML container
│
└── 📊 Your Data
    └── synthetic_outpass_dataset.xlsx → Your dataset!
```

---

## 🎯 Getting Started

### For Quick Testing
1. **Read:** `README_QUICKSTART.md`
2. **Run:** `docker-compose up`
3. **Test:** http://localhost:5001

### For Full Integration (You Have Dataset)
1. **Read:** `QUICK_TRAIN_AND_DEPLOY.md`
2. **Do:** Convert Excel → CSV
3. **Do:** Train model
4. **Do:** Update app.py
5. **Test:** Everything works

### For Custom Integration
1. **Read:** `INTEGRATE_YOUR_DATA.md`
2. **Follow:** Step-by-step guide
3. **Test:** Your trained model

---

## 🔑 Demo Credentials

After seeding database (`cd backend && npm run seed`):

- **Student**: `bhargav.teja@college.edu` / `password123`
- **Parent**: `ravi@gmail.com` / `password123`
- **Admin**: `venkat.rao@college.edu` / `password123`

---

## 📊 ML Model Information

**Current:** Mock model (rule-based simulation)  
**Target:** XGBoost trained on historical data  
**Features:** Violations, late returns, rejection rate, frequency, context  
**Categories:** Low (0-30), Medium (31-60), High (61-100)  

**Training:**
```bash
cd ml-service
pip install -r requirements.txt
python train_model.py
```

---

## 🐳 Docker Deployment

```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

Services:
- **Backend**: http://localhost:5001
- **ML Service**: http://localhost:8000
- **MongoDB**: localhost:27017

---

## 🧪 API Endpoints

### Core Endpoints
- `POST /api/auth/login` - Login
- `POST /api/requests` - Create outpass request
- `GET /api/requests` - Get requests
- `PUT /api/requests/:id/parent-approve` - Parent approval
- `PUT /api/requests/:id/admin-approve` - Admin approval

### ML Endpoints
- `POST http://localhost:8000/predict` - Predict risk
- `GET http://localhost:8000/health` - Health check

---

## 📈 ML Workflow

```
Student Request → Backend → ML Service
                      ↓           ↓
                    Data    Model Prediction
                      ↓           ↓
                    └─────→ Risk Score ←────┘
                             ↓
                    Store in Database
                             ↓
                    Show in UI/QR
```

**Fallback:** If ML service down → Use rule-based calculation

---

## 🎓 Learning Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [XGBoost Guide](https://xgboost.readthedocs.io/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/docs/)

---

## 🐛 Troubleshooting

**ML service not responding:**
```bash
curl http://localhost:8000/health
docker-compose logs ml-service
```

**Backend not using ML:**
```bash
export USE_ML_PREDICTION=true
# Check logs: Should see "ML Risk: XX.X"
```

**MongoDB issues:**
```bash
docker-compose logs mongo
# Or install MongoDB locally
```

**More help:** Check documentation files above or see `ML_INTEGRATION_GUIDE.md` → Troubleshooting

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch
3. Test thoroughly
4. Submit pull request

---

## 📝 License

ISC

---

## 🏆 Acknowledgments

- Express.js community
- FastAPI team
- MongoDB team
- Open source ML libraries

---

## 📞 Support

**Documentation:** See files listed in "Documentation Guide" above  
**Issues:** Check logs and troubleshooting sections  
**Questions:** Read relevant guides first

---

## 🎯 Current Status

✅ **Core System:** Production ready  
✅ **ML Infrastructure:** Complete  
⏳ **ML Model:** Mock active, real model ready to deploy  
✅ **Docker:** Configured  
✅ **Documentation:** Comprehensive  

**Next:** Train your model and deploy!

---

**Start with `START_HERE.md` to choose your path!** 🚀