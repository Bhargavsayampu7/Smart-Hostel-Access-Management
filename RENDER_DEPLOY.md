# Deploying to Render - Complete Guide

This guide covers deploying the **entire** Smart Hostel Access Management system to Render.

## Why Render?

✅ **Native FastAPI support** (no serverless cold starts)  
✅ **Built-in PostgreSQL** (free tier included)  
✅ **All services on one platform** (simpler management)  
✅ **Persistent disk** (SQLite works if needed)  
✅ **Always-on free tier** (750 hours/month per service)  
✅ **Infrastructure-as-code** (render.yaml)

---

## Architecture

```
Render Platform
├── hostel-frontend (Static Site)
├── hostel-backend (Web Service - FastAPI)
├── hostel-ml (Web Service - FastAPI)
└── hostel-db (PostgreSQL Database)
```

**URLs:**
- Frontend: `https://hostel-frontend.onrender.com`
- Backend API: `https://hostel-backend.onrender.com/api`
- ML Service: `https://hostel-ml.onrender.com`
- Database: Internal connection string

---

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com) (free)
2. **GitHub Repository**: Push your code to GitHub
3. **Git**: Ensure your code is committed

---

## Deployment Method 1: Blueprint (Recommended)

This method uses `render.yaml` to deploy everything at once.

### Step 1: Connect GitHub Repository

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub account (if not already connected)
4. Select your repository
5. Render will auto-detect `render.yaml`

### Step 2: Review Configuration

Render will show all services defined in `render.yaml`:
- ✅ hostel-db (PostgreSQL)
- ✅ hostel-backend (Web Service)
- ✅ hostel-ml (Web Service)
- ✅ hostel-frontend (Static Site)

### Step 3: Set Environment Variables

The blueprint auto-configures most variables, but you should:

1. **JWT_SECRET**: Render will auto-generate a secure value
2. **CORS_ORIGINS**: Update after frontend deploys to use actual URL
3. **ML_API_URL**: Update after ML service deploys to use actual URL

### Step 4: Deploy

1. Click **"Apply"**
2. Render will deploy all services simultaneously
3. Wait 5-10 minutes for initial deployment

### Step 5: Update Cross-Service URLs

After all services are deployed:

1. **Update Backend CORS**:
   - Go to `hostel-backend` → Environment
   - Update `CORS_ORIGINS` to: `https://hostel-frontend.onrender.com`
   - Save (triggers redeploy)

2. **Update Backend ML URL**:
   - Update `ML_API_URL` to: `https://hostel-ml.onrender.com`
   - Save (triggers redeploy)

---

## Deployment Method 2: Manual (Step-by-Step)

If you prefer manual control:

### Step 1: Create PostgreSQL Database

1. Render Dashboard → **New** → **PostgreSQL**
2. Name: `hostel-db`
3. Database: `hostel_db`
4. User: `hostel_user`
5. Region: Choose closest to your users
6. Plan: **Free**
7. Click **Create Database**
8. **Copy Internal Database URL** (starts with `postgresql://`)

### Step 2: Deploy ML Service

1. **New** → **Web Service**
2. Connect GitHub repository
3. Configure:
   - **Name**: `hostel-ml`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `ml-service`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
4. **Environment Variables**:
   - `MODEL_VERSION` = `v1.0`
   - `ENVIRONMENT` = `production`
5. **Advanced**:
   - Health Check Path: `/health`
6. Click **Create Web Service**
7. **Copy the service URL** (e.g., `https://hostel-ml.onrender.com`)

### Step 3: Deploy Backend

1. **New** → **Web Service**
2. Configure:
   - **Name**: `hostel-backend`
   - **Root Directory**: `backend-fastapi`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app.main:app -c gunicorn.conf.py`
3. **Environment Variables**:
   - `DATABASE_URL` = (paste from Step 1)
   - `JWT_SECRET` = (generate with `openssl rand -hex 32`)
   - `ML_API_URL` = (paste from Step 2)
   - `CORS_ORIGINS` = `https://hostel-frontend.onrender.com` (will update after frontend)
   - `ENVIRONMENT` = `production`
   - `USE_ML_PREDICTION` = `true`
4. **Advanced**:
   - Health Check Path: `/api/health`
5. Click **Create Web Service**
6. **Copy the service URL** (e.g., `https://hostel-backend.onrender.com`)

### Step 4: Deploy Frontend

1. **New** → **Static Site**
2. Configure:
   - **Name**: `hostel-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
3. **Environment Variables**:
   - `VITE_API_BASE_URL` = `https://hostel-backend.onrender.com/api` (from Step 3)
4. **Advanced**:
   - Add Rewrite Rule:
     - Source: `/*`
     - Destination: `/index.html`
     - Action: `Rewrite`
5. Click **Create Static Site**

### Step 5: Update Backend CORS

1. Go to `hostel-backend` service
2. Environment → Edit `CORS_ORIGINS`
3. Change to actual frontend URL: `https://hostel-frontend.onrender.com`
4. Save (triggers automatic redeploy)

---

## Post-Deployment Verification

### 1. Check All Services Are Live

Visit each URL and verify:

- ✅ **Frontend**: `https://hostel-frontend.onrender.com` → Should show role selection page
- ✅ **Backend API Docs**: `https://hostel-backend.onrender.com/docs` → FastAPI Swagger UI
- ✅ **Backend Health**: `https://hostel-backend.onrender.com/api/health` → `{"status":"ok"}`
- ✅ **ML Service Health**: `https://hostel-ml.onrender.com/health` → `{"status":"healthy"}`

### 2. Test Login Flow

1. Go to frontend URL
2. Click **Student** role
3. Login with:
   - Email: `student@test.com`
   - Password: `student123`
4. Should redirect to student dashboard

### 3. Test End-to-End Flow

1. **Create Outpass Request** (as student)
2. **Verify ML Risk Score** appears
3. **Login as Parent** (`parent@test.com` / `parent123`)
4. **Approve Request**
5. **Login as Warden** (`warden@test.com` / `warden123`)
6. **Approve Request**
7. **Generate QR Code** (as student)
8. **Login as Security** (`security@test.com` / `security123`)
9. **Scan QR** (manual token entry)
10. **Verify Scan Event** recorded

### 4. Check Database

1. Render Dashboard → `hostel-db` → **Connect**
2. Use provided connection command or GUI tool
3. Verify tables exist:
   ```sql
   \dt
   -- Should show: users, passes, qr_tokens, scan_events, locations, etc.
   ```

### 5. Monitor Logs

Check logs for each service:
- Render Dashboard → Service → **Logs** tab
- Look for errors (red text)
- Verify startup messages

---

## Environment Variables Reference

### Backend (`hostel-backend`)

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | From hostel-db connection string | ✅ Yes |
| `JWT_SECRET` | Random 32+ char string | ✅ Yes |
| `ML_API_URL` | `https://hostel-ml.onrender.com` | ✅ Yes |
| `CORS_ORIGINS` | `https://hostel-frontend.onrender.com` | ✅ Yes |
| `ENVIRONMENT` | `production` | ✅ Yes |
| `USE_ML_PREDICTION` | `true` | Optional |

### Frontend (`hostel-frontend`)

| Variable | Value | Required |
|----------|-------|----------|
| `VITE_API_BASE_URL` | `https://hostel-backend.onrender.com/api` | ✅ Yes |

### ML Service (`hostel-ml`)

| Variable | Value | Required |
|----------|-------|----------|
| `MODEL_VERSION` | `v1.0` | Optional |
| `ENVIRONMENT` | `production` | Optional |

---

## Troubleshooting

### Frontend Shows Blank Page

**Check:**
1. Build logs for errors: `npm run build` failures
2. Browser console for JavaScript errors
3. Network tab for failed API calls

**Fix:**
- Ensure `VITE_API_BASE_URL` is set correctly
- Check CORS errors → verify `CORS_ORIGINS` in backend

### Backend 500 Errors

**Check:**
1. Service logs in Render dashboard
2. Database connection: `DATABASE_URL` correct?
3. Environment variables all set?

**Fix:**
- Verify PostgreSQL URL format: `postgresql://...`
- Check JWT_SECRET is set
- Ensure database is connected and accessible

### ML Service Not Responding

**Check:**
1. Service status: Is it running?
2. Health endpoint: `https://hostel-ml.onrender.com/health`
3. Model files exist in `ml-service/models/`?

**Fix:**
- If model files missing, backend will fallback to mock predictions
- Check logs for model loading errors
- Verify `requirements.txt` has all ML dependencies

### CORS Errors in Browser

**Symptoms:**
```
Access to fetch at 'https://hostel-backend.onrender.com/api/auth/login' 
from origin 'https://hostel-frontend.onrender.com' has been blocked by CORS policy
```

**Fix:**
1. Go to `hostel-backend` → Environment
2. Update `CORS_ORIGINS` to include frontend URL
3. Save (triggers redeploy)
4. Wait 2-3 minutes for redeploy
5. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)

### Database Tables Not Created

**Check:**
1. Backend logs on first startup
2. Database connection successful?

**Fix:**
- Tables auto-create on first API call
- Try calling `/api/health` endpoint
- Check `init_db()` logs in backend startup

### Free Tier Limitations

**Render Free Tier:**
- Services spin down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds (cold start)
- 750 hours/month per service (enough for 24/7 if only one service)
- PostgreSQL: 90 days inactivity limit, 1GB storage

**Solutions:**
- Upgrade to paid plan ($7/month per service) for always-on
- Use a cron job to ping health endpoints every 10 minutes
- Accept cold starts for demo/development

---

## Production Checklist

- [ ] All services deployed and healthy
- [ ] Database connected and tables created
- [ ] Demo users can login (student, parent, warden, security)
- [ ] ML risk scores appear in dashboards
- [ ] QR code generation works
- [ ] QR scanning works (security dashboard)
- [ ] Location tracking works
- [ ] CORS configured with actual frontend URL
- [ ] JWT_SECRET is strong random value (not default)
- [ ] Logs monitored for errors
- [ ] Custom domain configured (optional)

---

## Updating Your Deployment

### Code Changes

1. Push changes to GitHub
2. Render auto-deploys on push (if auto-deploy enabled)
3. Or manually trigger: Service → **Manual Deploy** → **Deploy latest commit**

### Environment Variable Changes

1. Service → **Environment**
2. Edit variable
3. **Save** (triggers automatic redeploy)

### Database Migrations

For schema changes:
```bash
# Local: Create migration
cd backend-fastapi
alembic revision --autogenerate -m "description"
git add . && git commit -m "Add migration" && git push

# Render will auto-run migrations on deploy if configured
# Or manually: Service → Shell → alembic upgrade head
```

---

## Cost Estimate

### Free Tier (All Services)
- PostgreSQL: Free (1GB, 90 days inactivity)
- Backend: Free (750 hours/month)
- ML Service: Free (750 hours/month)
- Frontend: Free (100GB bandwidth)

**Total: $0/month** (with spin-down after inactivity)

### Paid Tier (Always-On)
- PostgreSQL: $7/month (10GB)
- Backend: $7/month (always-on)
- ML Service: $7/month (always-on)
- Frontend: Free

**Total: $21/month** (production-grade, no cold starts)

---

## Next Steps

1. ✅ Deploy all services
2. ✅ Verify functionality
3. 🔄 Set up monitoring (Render provides basic metrics)
4. 🔄 Configure custom domain (optional)
5. 🔄 Set up automated backups (PostgreSQL)
6. 🔄 Add health check pings (prevent spin-down)

---

## Support

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **Service Logs**: Dashboard → Service → Logs
- **Database Shell**: Dashboard → hostel-db → Connect

---

**Deployment complete! 🚀**

Your Smart Hostel Access Management system is now live on Render.
