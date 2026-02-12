# Deploying to Vercel (Option 2: Monolithic)

This guide covers deploying the **entire** Smart Hostel Access Management system to Vercel (frontend + backend).

> **⚠️ IMPORTANT FIXES APPLIED**: This guide has been updated with fixes for:
> - PostgreSQL driver mismatch (psycopg3 vs psycopg2)
> - Health endpoint routing issues
> - Missing dependencies in api/requirements.txt
> - Environment variable configuration

## Architecture

- **Frontend**: React/Vite app → Static site on Vercel
- **Backend**: FastAPI → Serverless functions on Vercel (`/api/*`)
- **ML Service**: Deploy separately (Railway/Render) or integrate into backend
- **Database**: **PostgreSQL required** (SQLite won't work on Vercel serverless)

## Prerequisites

1. Vercel account (free tier works)
2. Vercel CLI installed: `npm i -g vercel`
3. GitHub repo connected (optional, but recommended)
4. **PostgreSQL database** (Vercel Postgres, Supabase, Railway, or Render)

> **✅ FIXED**: `api/requirements.txt` now includes correct PostgreSQL driver (`psycopg[binary]==3.2.10`)

## Step 1: Set Up PostgreSQL Database

**Option A: Vercel Postgres (Recommended)**
1. In Vercel dashboard → Storage → Create Database → Postgres
2. Copy the connection string (will be used as `DATABASE_URL`)
3. **Important**: Vercel provides `POSTGRES_URL` - backend now auto-detects this

**Option B: External PostgreSQL**
- Use Supabase, Railway, or Render PostgreSQL
- Get connection string: `postgresql://user:pass@host:5432/dbname`
- Backend will auto-convert to `postgresql+psycopg://` format

> **✅ FIXED**: Backend now handles multiple PostgreSQL URL formats (`DATABASE_URL`, `POSTGRES_URL`, `POSTGRESQL_URL`)

## Step 2: Set Environment Variables

In Vercel dashboard → Project Settings → Environment Variables, add:

```bash
# Database (REQUIRED - PostgreSQL only, not SQLite)
DATABASE_URL=postgresql://user:pass@host:5432/dbname
# Or if using Vercel Postgres, it auto-sets POSTGRES_URL

# JWT Secret (REQUIRED - change this!)
JWT_SECRET=your-super-secret-key-change-this-in-production-min-32-chars

# ML Service (Optional - if deploying separately)
ML_SERVICE_URL=https://your-ml-service.railway.app
# Or leave empty/unset to use fallback mock predictions

# CORS Origins (REQUIRED for production)
CORS_ORIGINS=https://your-project.vercel.app

# Environment
ENVIRONMENT=production

# Frontend API URL (Optional - defaults to /api in production)
VITE_API_BASE_URL=/api
```

**Important Notes:**
- SQLite (`sqlite:///./dev.db`) **will NOT work** on Vercel serverless functions
- You **must** use PostgreSQL or another external database
- Database tables will be auto-created on first API request (via `init_db()`)

> **✅ FIXED**: Backend now uses environment-based CORS instead of `allow_origins=["*"]`

## Step 3: Deploy ML Service (Optional but Recommended)

The ML service is best deployed separately due to model size:

**Option A: Railway**
```bash
cd ml-service
railway init
railway up
```

**Option B: Render**
- Create new Web Service
- Point to `ml-service/`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn app:app --host 0.0.0.0 --port $PORT`

Then set `ML_SERVICE_URL` in Vercel env vars to your ML service URL.

**Note:** If ML service is unavailable, the backend will fallback to mock predictions.

## Step 4: Deploy to Vercel

### Via CLI:

```bash
# From project root
vercel

# Follow prompts:
# - Link to existing project? (or create new)
# - Override settings? No (use vercel.json)
```

### Via GitHub:

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New..." → "Project"
4. Import your Git repository
5. Vercel will auto-detect `vercel.json` configuration
6. Click "Deploy"

## Step 5: Initialize Database

After first deployment, the database tables need to be created. You can do this by:

**Option A: Call the health endpoint**
```bash
curl https://your-project.vercel.app/api/health
```

**Option B: Make any API call** (e.g., login attempt)

**Option C: Use Vercel CLI to run a one-time script**
```bash
# Create a temporary script
cat > init_db.py << EOF
import os
os.environ['DATABASE_URL'] = 'your-postgres-url'
from backend-fastapi.app.db.session import init_db
init_db()
print("Database initialized!")
EOF

# Run via Vercel CLI (if supported) or locally with same DATABASE_URL
```

**Note:** Demo users (student@test.com, parent@test.com, etc.) will be auto-seeded on first `/api/auth/login` or `/api/auth/register` call.

## Step 6: Verify Deployment

1. **Frontend**: Visit `https://your-project.vercel.app`
2. **Backend API**: Visit `https://your-project.vercel.app/api/docs` (FastAPI Swagger UI)
3. **Health Check**: `https://your-project.vercel.app/api/health`
   - Should return: `{"status":"ok","service":"hostel-backend","version":"0.1.0"}`

> **✅ FIXED**: Health endpoint now available at both `/health` and `/api/health` for compatibility

## Project Structure for Vercel

```
project-root/
├── frontend/          # React app (built to static files)
├── backend-fastapi/   # FastAPI backend (included in serverless function)
├── api/
│   └── index.py      # Vercel serverless function entry point
├── vercel.json        # Vercel configuration
└── api/
    └── requirements.txt  # Python dependencies for serverless function
```

## Troubleshooting

### Backend 500 errors:
- Check Vercel function logs: `vercel logs` or Vercel dashboard → Functions → Logs
- Ensure `mangum` is in `api/requirements.txt`
- Verify `DATABASE_URL` is set correctly (PostgreSQL, not SQLite)
- Check database connection: ensure PostgreSQL is accessible from Vercel

### Frontend can't reach backend:
- Check browser console for CORS errors
- Verify `VITE_API_BASE_URL` is set to `/api` (relative path)
- Ensure API routes are working: `https://your-project.vercel.app/api/health`

### Database initialization issues:
- SQLite won't work on Vercel (no persistent file system)
- Use PostgreSQL (Vercel Postgres, Supabase, Railway, Render)
- Tables auto-create on first request, but you may need to seed demo users manually

### ML service not responding:
- Verify `ML_SERVICE_URL` is set correctly (if using external ML service)
- Check ML service is running and accessible
- Backend will fallback to mock predictions if ML is down (check logs)

### "Module not found" errors:
- Ensure all dependencies are in `api/requirements.txt`
- Check `backend-fastapi/` is included in `vercel.json` → `functions` → `includeFiles`

## Production Checklist

- [ ] Change `JWT_SECRET` to a strong random value (min 32 characters)
- [ ] Use PostgreSQL (Vercel Postgres or external) - **SQLite won't work**
- [ ] Set up database backups (Vercel Postgres has automatic backups)
- [ ] Restrict CORS origins in `backend-fastapi/app/main.py` (replace `allow_origins=["*"]`)
- [ ] Configure ML service with proper authentication (if external)
- [ ] Enable Vercel analytics/monitoring
- [ ] Set up environment-specific variables (Production, Preview, Development)
- [ ] Test all user flows (login, pass creation, QR scan, location tracking)

## Demo Credentials (After First Deploy)

After deployment and database initialization, use these credentials:

- **Student**: `student@test.com` / `student123`
- **Parent**: `parent@test.com` / `parent123`
- **Warden**: `warden@test.com` / `warden123`
- **Security**: `security@test.com` / `security123`

These are auto-seeded on first API call to `/api/auth/login` or `/api/auth/register`.

## Next Steps

1. Deploy ML service separately (Railway/Render) for better performance
2. Set up monitoring (Vercel Analytics, Sentry)
3. Configure custom domain
4. Set up CI/CD for automatic deployments
