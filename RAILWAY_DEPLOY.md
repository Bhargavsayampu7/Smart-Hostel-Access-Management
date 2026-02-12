# Deploying to Railway - Complete Guide

This guide covers deploying the Smart Hostel Access Management system to Railway.

## Why Railway?

✅ **Simple deployment** (one command)  
✅ **Built-in PostgreSQL** (free tier included)  
✅ **Automatic HTTPS** (custom domains easy)  
✅ **GitHub integration** (auto-deploy on push)  
✅ **Great DX** (developer experience)

---

## Architecture

```
Railway Platform
├── hostel-frontend (Static/Node service)
├── hostel-backend (Python service)
├── hostel-ml (Python service)
└── PostgreSQL (Database)
```

---

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app) (free $5 credit/month)
2. **Railway CLI**: `npm install -g @railway/cli` or `brew install railway`
3. **GitHub Repository**: Push your code to GitHub

---

## Deployment Method 1: CLI (Recommended)

### Step 1: Login to Railway

```bash
railway login
```

This opens a browser for authentication.

### Step 2: Create New Project

```bash
cd /path/to/final-hostel-system
railway init
```

- Select: **Create new project**
- Name: `hostel-system`

### Step 3: Add PostgreSQL Database

```bash
railway add --database postgresql
```

Railway will:
- Create a PostgreSQL instance
- Set `DATABASE_URL` environment variable automatically

### Step 4: Deploy Backend

```bash
cd backend-fastapi
railway up
```

Railway will:
- Detect Python project
- Install dependencies from `requirements.txt`
- Start with: `gunicorn app.main:app -c gunicorn.conf.py`

**Set environment variables:**
```bash
railway variables set JWT_SECRET=$(openssl rand -hex 32)
railway variables set ENVIRONMENT=production
railway variables set ML_API_URL=https://hostel-ml.up.railway.app
railway variables set CORS_ORIGINS=https://hostel-frontend.up.railway.app
railway variables set USE_ML_PREDICTION=true
```

### Step 5: Deploy ML Service

```bash
cd ../ml-service
railway up
```

**Set environment variables:**
```bash
railway variables set MODEL_VERSION=v1.0
railway variables set ENVIRONMENT=production
```

### Step 6: Deploy Frontend

```bash
cd ../frontend
railway up
```

**Set environment variables:**
```bash
railway variables set VITE_API_BASE_URL=https://hostel-backend.up.railway.app/api
```

**Configure build:**
- Build Command: `npm install && npm run build`
- Start Command: `npx serve -s dist -p $PORT`

---

## Deployment Method 2: GitHub Integration

### Step 1: Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **New Project**
3. Select **Deploy from GitHub repo**
4. Choose your repository
5. Railway will detect multiple services

### Step 2: Configure Services

Railway will create separate services for each directory:

#### Backend Service
- **Root Directory**: `backend-fastapi`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn app.main:app -c gunicorn.conf.py`
- **Environment Variables**:
  ```
  DATABASE_URL=(auto-set by Railway)
  JWT_SECRET=(generate: openssl rand -hex 32)
  ML_API_URL=https://${{ML_SERVICE.RAILWAY_PUBLIC_DOMAIN}}
  CORS_ORIGINS=https://${{FRONTEND.RAILWAY_PUBLIC_DOMAIN}}
  ENVIRONMENT=production
  USE_ML_PREDICTION=true
  ```

#### ML Service
- **Root Directory**: `ml-service`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
- **Environment Variables**:
  ```
  MODEL_VERSION=v1.0
  ENVIRONMENT=production
  ```

#### Frontend Service
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npx serve -s dist -p $PORT`
- **Environment Variables**:
  ```
  VITE_API_BASE_URL=https://${{BACKEND.RAILWAY_PUBLIC_DOMAIN}}/api
  ```

### Step 3: Add PostgreSQL

1. In your project, click **New**
2. Select **Database** → **PostgreSQL**
3. Railway auto-connects it to all services

### Step 4: Generate Domains

1. Each service → **Settings** → **Generate Domain**
2. Railway provides: `https://your-service.up.railway.app`
3. Or add custom domain

---

## Configuration Files

### Backend: Procfile (Optional)

Create `backend-fastapi/Procfile`:
```
web: gunicorn app.main:app -c gunicorn.conf.py
```

### Frontend: Procfile (Optional)

Create `frontend/Procfile`:
```
web: npx serve -s dist -p $PORT
```

### Railway.json (Optional)

Create `railway.json` at root:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## Environment Variables Reference

### Backend

| Variable | Value | Source |
|----------|-------|--------|
| `DATABASE_URL` | Auto-set by Railway | Railway |
| `JWT_SECRET` | `openssl rand -hex 32` | Manual |
| `ML_API_URL` | `https://hostel-ml.up.railway.app` | Service URL |
| `CORS_ORIGINS` | `https://hostel-frontend.up.railway.app` | Service URL |
| `ENVIRONMENT` | `production` | Manual |
| `USE_ML_PREDICTION` | `true` | Manual |

### Frontend

| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | `https://hostel-backend.up.railway.app/api` |

### ML Service

| Variable | Value |
|----------|-------|
| `MODEL_VERSION` | `v1.0` |
| `ENVIRONMENT` | `production` |

---

## Verification

### 1. Check Service Status

```bash
railway status
```

All services should show: ✅ **Deployed**

### 2. View Logs

```bash
# Backend logs
railway logs --service backend-fastapi

# ML service logs
railway logs --service ml-service

# Frontend logs
railway logs --service frontend
```

### 3. Test Endpoints

```bash
# Backend health
curl https://hostel-backend.up.railway.app/api/health

# ML health
curl https://hostel-ml.up.railway.app/health

# Frontend
curl https://hostel-frontend.up.railway.app
```

### 4. Test Login

1. Visit frontend URL
2. Login with `student@test.com` / `student123`
3. Verify dashboard loads

---

## Troubleshooting

### Build Fails

**Check:**
- Build logs in Railway dashboard
- Dependencies in `requirements.txt` or `package.json`

**Fix:**
```bash
railway logs --service <service-name>
```

### Database Connection Error

**Check:**
- `DATABASE_URL` is set
- PostgreSQL service is running

**Fix:**
```bash
railway variables
# Verify DATABASE_URL exists
```

### CORS Errors

**Fix:**
1. Update `CORS_ORIGINS` in backend service
2. Use actual frontend domain
3. Redeploy: `railway up`

### Environment Variables Not Working

**Fix:**
```bash
# List all variables
railway variables

# Set variable
railway variables set KEY=VALUE

# Delete variable
railway variables delete KEY
```

---

## Custom Domains

### Add Custom Domain

1. Service → **Settings** → **Domains**
2. Click **Add Domain**
3. Enter your domain: `app.yourdomain.com`
4. Add DNS records (Railway provides instructions):
   ```
   Type: CNAME
   Name: app
   Value: <railway-provided-value>
   ```

### Update Environment Variables

After adding custom domains, update:

**Backend:**
```bash
railway variables set CORS_ORIGINS=https://app.yourdomain.com
```

**Frontend:**
```bash
railway variables set VITE_API_BASE_URL=https://api.yourdomain.com/api
```

---

## Scaling

### Vertical Scaling (More Resources)

1. Service → **Settings** → **Resources**
2. Adjust:
   - Memory: 512MB → 2GB
   - CPU: Shared → Dedicated

### Horizontal Scaling (More Instances)

Railway Pro plan required:
```bash
railway scale --replicas 3
```

---

## Cost Estimate

### Free Tier
- **$5 credit/month** (execution time based)
- Enough for light development/demo usage
- All services can run on free tier

### Paid Tier (Hobby Plan: $5/month)
- **$5/month base** + usage
- Typical usage: ~$10-15/month for all services
- PostgreSQL included
- Custom domains included

---

## Monitoring

### View Metrics

1. Railway Dashboard → Service → **Metrics**
2. See:
   - CPU usage
   - Memory usage
   - Network traffic
   - Request count

### Set Up Alerts

1. Service → **Settings** → **Alerts**
2. Configure:
   - High CPU usage
   - High memory usage
   - Deployment failures

---

## Backups

### PostgreSQL Backups

Railway automatically backs up PostgreSQL:
- **Frequency**: Daily
- **Retention**: 7 days (Hobby plan)
- **Restore**: Dashboard → Database → Backups

### Manual Backup

```bash
railway run pg_dump $DATABASE_URL > backup.sql
```

---

## CI/CD

### Auto-Deploy on Git Push

1. Service → **Settings** → **Source**
2. Enable **Auto-Deploy**
3. Select branch: `main`
4. Every push to `main` triggers deployment

### Deploy Specific Branch

```bash
railway up --branch staging
```

---

## Production Checklist

- [ ] All services deployed
- [ ] PostgreSQL connected
- [ ] Environment variables set
- [ ] Custom domains configured (optional)
- [ ] CORS origins updated with actual URLs
- [ ] JWT_SECRET is secure random value
- [ ] Auto-deploy enabled
- [ ] Monitoring/alerts configured
- [ ] Database backups verified
- [ ] All endpoints tested

---

## Useful Commands

```bash
# Deploy current directory
railway up

# View logs
railway logs

# Open service in browser
railway open

# Run command in Railway environment
railway run <command>

# Connect to PostgreSQL
railway connect postgres

# List all variables
railway variables

# Set variable
railway variables set KEY=VALUE

# Link to existing project
railway link

# Unlink project
railway unlink

# View project status
railway status
```

---

## Migration from Other Platforms

### From Vercel

1. Export environment variables from Vercel
2. Import to Railway: `railway variables set ...`
3. Update frontend build to use Railway domains

### From Heroku

1. Export Heroku config: `heroku config -s > .env`
2. Import to Railway: `railway variables set $(cat .env)`
3. Update `Procfile` if needed

---

## Support

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://status.railway.app

---

**Deployment complete! 🚀**

Your Smart Hostel Access Management system is now live on Railway.
