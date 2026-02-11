# Smart Hostel Access Management (React + FastAPI + ML)

> **Modern, ML-powered hostel outpass system with QR, live location, and role-based dashboards.**

---

## 🎯 Key Features

- **Role-based access**
  - Student, Parent, Warden, Security roles with protected routes.
  - Landing screen lets you pick a role, then pre-fills demo credentials.

- **Student experience**
  - Create outpass requests (outpass/homepass/emergency).
  - See status and ML risk signal for each request.
  - Generate QR codes for approved passes.
  - Live geolocation sharing while an active pass is in use.

- **Parent experience**
  - Approve/reject child requests.
  - See child’s aggregated ML risk score and violation count.
  - View last known live location with an embedded map.

- **Warden (admin) experience**
  - Approval queue for parent-approved requests.
  - Student risk table (latest ML risk + pass status).
  - Analytics:
    - Risk distribution (low/medium/high).
    - Late returns per day.
    - Parent response time histogram.

- **Security experience**
  - Camera-based QR scanning + manual token entry.
  - One-time QR validation with strong replay protection.
  - OUT/IN tracking:
    - First ALLOW marks exit.
    - Second ALLOW marks return and closes the pass.
  - Pass history view with scan events, location points, and delay minutes.

- **ML risk engine**
  - Python FastAPI microservice running XGBoost v1.0.
  - Trained on `synthetic_outpass_dataset.csv`.
  - Centralized `/api/pass/risk` endpoint in FastAPI that calls the ML service.
  - Risk scores stored on passes and reused across dashboards (student/parent/warden).

---

## 🛠️ Tech Stack

- **Frontend**
  - React 18 + Vite
  - React Router v6
  - Tailwind CSS
  - Axios
  - Recharts (analytics)
  - react-qr-reader (camera QR scanner)

- **Backend (API)**
  - FastAPI
  - SQLModel / SQLAlchemy
  - SQLite (dev) – can be swapped for Postgres/MySQL
  - JWT (python-jose) for auth

- **ML Service**
  - FastAPI
  - scikit-learn + XGBoost
  - joblib / pickle for model artifacts
  - Single active model: `risk_model_v1.0.joblib`

---

## 📁 Project Structure (current)

```bash
final-hostel-system.zip/
├── backend-fastapi/          # FastAPI backend (main API)
│   ├── app/
│   │   ├── main.py           # App entry, routers wired under /api
│   │   ├── models.py         # SQLModel tables (users, passes, qr_tokens, scan_events, locations, ...)
│   │   ├── schemas.py        # Pydantic request/response models
│   │   ├── deps.py           # Auth dependencies (get_current_user, role checks)
│   │   ├── core/             # Security & config
│   │   ├── db/               # DB session
│   │   ├── routers/          # Feature routers:
│   │   │   ├── auth.py       # /api/auth (login, me, seed demo users)
│   │   │   ├── passes.py     # /api/passes (core pass creation/listing)
│   │   │   ├── approvals.py  # /api/approvals (parent/admin decisions)
│   │   │   ├── requests_compat.py  # /api/requests (React compatibility)
│   │   │   ├── students_compat.py  # /api/students (profile + ML-backed stats)
│   │   │   ├── parents_compat.py   # /api/parents (dashboard + ML-backed risk)
│   │   │   ├── admin_compat.py     # /api/admin (queue, students, analytics)
│   │   │   ├── qr.py         # /api/qr (phase-aware QR tokens for OUT/IN)
│   │   │   ├── scan.py       # /api/scan (QR validation, pass history)
│   │   │   ├── location.py   # /api/location (geolocation heartbeats & latest)
│   │   │   └── risk.py       # /api/pass/risk (delegates to ML service)
│   │   └── services/ml_client.py  # HTTP client for ML service
│   └── requirements.txt
│
├── frontend/                 # React/Vite frontend
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx           # Routing + ProtectedRoute + role landing
│       ├── context/AuthContext.jsx
│       ├── services/api.js   # Axios client, API wrappers
│       ├── components/       # Layout, Card, Button, Input, etc.
│       └── pages/
│           ├── RoleSelect.jsx
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── StudentDashboard.jsx
│           ├── ParentDashboard.jsx
│           ├── AdminDashboard.jsx
│           ├── SecurityDashboard.jsx
│           └── PassHistory.jsx
│
├── ml-service/               # ML microservice
│   ├── app.py                # FastAPI risk service
│   ├── train_model.py        # Training pipeline (XGBoost v1.0)
│   ├── requirements.txt
│   ├── data/
│   │   └── synthetic_outpass_dataset.csv  # Training data (copy of root CSV)
│   └── models/
│       ├── risk_model_v1.0.joblib
│       ├── risk_model_v1.0.json
│       ├── scaler_v1.0.joblib
│       ├── label_encoders_v1.0.pkl
│       ├── feature_names_v1.0.txt
│       └── feature_importance_v1.0.csv
│
├── synthetic_outpass_dataset.csv  # Source dataset used by ml-service
└── README.md                      # This file
```

> Note: The legacy Node.js backend and static HTML/JS frontend have been removed.  
> All functionality is now served by `backend-fastapi/` + `frontend/` + `ml-service/`.

---

## 🚀 Running the System (dev)

Open three terminals from the project root.

### 1. Start the ML service

```bash
cd ml-service
pip install -r requirements.txt
python train_model.py     # optional if you want to retrain
uvicorn app:app --host 0.0.0.0 --port 8000
```

### 2. Start the FastAPI backend

```bash
cd backend-fastapi
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 5002
```

On startup, the backend will:

- Create the SQLite dev DB if missing.
- Seed demo users (student, parent, warden, security) exactly once.

### 3. Start the React frontend

```bash
cd frontend
npm install
npm run dev
```

Vite will show the local URL (typically `http://localhost:5173`).

---

## 🔑 Demo Credentials (FastAPI + React)

These are seeded by `backend-fastapi/app/routers/auth.py` on first run:

- **Student**: `student@test.com` / `student123`
- **Parent**: `parent@test.com` / `parent123`
- **Warden (admin)**: `warden@test.com` / `warden123`
- **Security**: `security@test.com` / `security123`

Login flow:

1. Visit `/` → role selection cards.
2. Click a role → `/login?role=student|parent|warden|security` with credentials pre-filled.
3. Submit → redirected to:
   - `/student`
   - `/parent`
   - `/warden`
   - `/security`

---

## 📊 ML Model Usage

- **Training**

```bash
cd ml-service
pip install -r requirements.txt
python train_model.py
```

This:

- Loads `../synthetic_outpass_dataset.csv`.
- Encodes categorical features (`hostel_block`, `destination_risk`).
- Trains an XGBoost classifier and evaluates it.
- Saves v1.0 artifacts under `ml-service/models/`.

- **Prediction**
  - Frontend → FastAPI: `POST /api/pass/risk` with feature vector.
  - FastAPI → ML service: `POST http://localhost:8000/predict`.
  - ML service returns `risk_score`, `risk_category`, `risk_probability`.
  - FastAPI stores risk scores on `Pass` records; dashboards aggregate/display them.

If the ML service is down, the backend will gracefully fall back to mock predictions via the ML client wrapper.

---

## 🔐 Security Model (overview)

- JWT-based auth for all protected routes (`/api/**`).
- Role guards:
  - `require_role("student")`, `require_role("parent")`, `require_role("admin")`, `require_role("security")`.
- QR tokens:
  - Short-lived signed JWTs with `pass_id`, `student_id`, `jti`, `nonce`, and `phase`.
  - Stored nonce hashes in `qr_tokens` prevent tampering and replay.
- Scan validation:
  - Verifies signature, TTL, nonce, one-time use, and pass status (`approved`).
  - Records every scan (allow/deny) in `scan_events` for auditing.

---

## 🧪 Important API Endpoints (FastAPI)

All paths are under `http://localhost:5002/api`.

- **Auth**
  - `POST /auth/login`
  - `GET /auth/me`

- **Student + Parent (compat)**
  - `GET /students/profile`
  - `GET /students/stats`  → ML-backed risk + violations
  - `GET /parents/dashboard` → childRisk + childViolations
  - `GET /parents/pending-approvals`
  - `GET /parents/activity`

- **Requests / Passes**
  - `POST /requests`  → create pass (compat payload)
  - `GET /requests`   → list passes (role-aware)
  - `PUT /requests/{id}/parent-approve`
  - `PUT /requests/{id}/admin-approve`
  - `GET /requests/{id}/qr` → student-only QR (phase-aware)

- **Risk**
  - `POST /pass/risk` → ML risk computation (delegates to ML service)

- **Location**
  - `POST /location` → student heartbeat while pass active
  - `GET /location/latest/{pass_id}` → last known location (student/parent/admin/security)

- **QR / Scan / History**
  - `GET /qr/{pass_id}` → issue OUT/IN QR for approved passes
  - `POST /scan` → validate token, record OUT/IN, set `returned_at` on IN
  - `GET /scan/history/{pass_id}` → pass summary + scan events + locations + delay

---

## 📌 Notes

- This repo is optimized for **local development and demonstration**:
  - SQLite for simplicity (swap for Postgres/MySQL for production).
  - CORS wide open (`allow_origins=["*"]`) – tighten for production.
- The legacy Node.js + Mongo implementation has been superseded by this stack.


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