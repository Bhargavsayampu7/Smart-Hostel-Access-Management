# Deployment Guide: Vercel

## Quick Deploy (Recommended: Separate Services)

For production, deploy each service separately for better scalability:

### 1. Frontend → Vercel (Static Site)

```bash
cd frontend
vercel --prod
```

**Environment Variables in Vercel:**
```
VITE_API_BASE_URL=https://your-backend-url.vercel.app/api
```

### 2. Backend (FastAPI) → Railway / Render

**Railway:**
```bash
cd backend-fastapi
railway init
railway up
```

**Render:**
- Create new Web Service
- Root: `backend-fastapi/`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**Environment Variables:**
```
DATABASE_URL=postgresql://... (or keep sqlite for dev)
JWT_SECRET=your-secret-key
ML_API_URL=https://your-ml-service-url
```

### 3. ML Service → Railway / Render

Same as backend, deploy `ml-service/` separately.

---

## Alternative: Monolithic Vercel Deploy

If you want everything on Vercel:

### Prerequisites

1. Install Mangum in backend:
```bash
cd backend-fastapi
pip install mangum
pip freeze > requirements.txt
```

2. Copy backend requirements to api folder:
```bash
cp backend-fastapi/requirements.txt api/requirements.txt
# Then add: mangum>=0.17.0
```

### Deploy Steps

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Set Environment Variables:**
```bash
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add ML_API_URL
vercel env add VITE_API_BASE_URL
```

3. **Deploy:**
```bash
vercel --prod
```

### Important Notes

- **Database**: SQLite won't persist on Vercel serverless. Use PostgreSQL (Vercel Postgres, Supabase, or Railway).
- **ML Service**: Deploy separately due to model file size limits.
- **Cold Starts**: First request may be slow (~2-5s) due to serverless cold starts.

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret for JWT signing | `your-random-secret-key` |
| `ML_API_URL` | ML service endpoint | `https://ml-service.railway.app` |
| `VITE_API_BASE_URL` | Backend API URL (frontend) | `https://api.vercel.app/api` |

---

## Post-Deployment Checklist

- [ ] Test login with demo credentials
- [ ] Verify ML risk scores appear in dashboards
- [ ] Test QR code generation and scanning
- [ ] Check location tracking works
- [ ] Verify OUT/IN scan flow
- [ ] Test all role dashboards load correctly
- [ ] Monitor Vercel function logs for errors
