# Deploying to Netlify - Complete Guide

This guide covers deploying the Smart Hostel Access Management system to Netlify (100% free, no credit card required).

## Why Netlify?

✅ **No credit card required**  
✅ **100% free tier** (100GB bandwidth, 300 build minutes)  
✅ **Automatic HTTPS**  
✅ **Serverless functions** (for backend API)  
✅ **Simple deployment** (drag & drop or CLI)  
✅ **Automatic deploys** from Git

---

## Architecture

```
Netlify Platform
├── Frontend (Static Site - React)
├── Backend API (Serverless Functions)
└── Database (External - Supabase/Neon free tier)
```

**Note:** ML service will use mock predictions (already built-in to backend).

---

## Prerequisites

1. **Netlify Account**: Sign up at [netlify.com](https://netlify.com) (free, no credit card)
2. **GitHub Account**: Your code should be on GitHub
3. **PostgreSQL Database**: Use Supabase or Neon (both free, no credit card)

---

## Step 1: Set Up Free PostgreSQL Database

### Option A: Supabase (Recommended)

1. Go to [supabase.com](https://supabase.com)
2. Sign up (free, no credit card)
3. Create new project
4. Copy **Connection String** (Database Settings → Connection String → URI)
5. Format: `postgresql://postgres:[password]@[host]:5432/postgres`

### Option B: Neon

1. Go to [neon.tech](https://neon.tech)
2. Sign up (free, no credit card)
3. Create new project
4. Copy **Connection String**

---

## Step 2: Deploy to Netlify

### Method 1: Netlify Dashboard (Easiest)

1. **Go to [Netlify Dashboard](https://app.netlify.com)**
2. Click **"Add new site"** → **"Import an existing project"**
3. **Connect to GitHub** and select your repository
4. **Configure build settings:**
   - **Base directory**: `frontend`
   - **Build command**: `npm install && npm run build`
   - **Publish directory**: `frontend/dist`
5. **Add environment variables** (Site settings → Environment variables):
   ```
   DATABASE_URL=postgresql://... (from Step 1)
   JWT_SECRET=your-random-secret-32-chars-min
   VITE_API_BASE_URL=/api
   ENVIRONMENT=production
   CORS_ORIGINS=https://your-site.netlify.app
   ```
6. Click **"Deploy site"**
7. Wait 2-3 minutes for deployment

### Method 2: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login (no credit card required)
netlify login

# Initialize and deploy
cd /Users/bhargavteja/Downloads/final-hostel-system.zip
netlify init

# Follow prompts:
# - Create & configure new site
# - Build command: npm install && npm run build
# - Publish directory: frontend/dist

# Deploy
netlify deploy --prod
```

---

## Step 3: Configure Backend API (Serverless Functions)

**Important:** Netlify serverless functions have limitations for FastAPI. We'll use a simplified approach:

### Option A: Use Mock ML Predictions (Simplest)

The backend already has mock predictions built-in. Just deploy the frontend and it will work!

### Option B: Deploy Backend Separately (Recommended for Full Features)

Deploy backend on a free platform that supports Python:

1. **Backend → Fly.io** (free tier, no credit card initially)
2. **ML Service → Hugging Face Spaces** (free)
3. **Frontend → Netlify**

**Quick Fly.io Backend Deploy:**
```bash
# Install flyctl
brew install flyctl

# Deploy backend
cd backend-fastapi
flyctl launch --no-deploy
flyctl deploy
```

Then update Netlify environment variable:
```
VITE_API_BASE_URL=https://your-backend.fly.dev/api
```

---

## Step 4: Update CORS After Deployment

After your Netlify site is deployed:

1. **Get your Netlify URL**: `https://your-site-name.netlify.app`
2. **Update backend CORS** (if using separate backend):
   - Set `CORS_ORIGINS=https://your-site-name.netlify.app`
3. **Redeploy backend** if needed

---

## Step 5: Verify Deployment

1. **Visit your Netlify URL**: `https://your-site-name.netlify.app`
2. **Test login**: Use `student@test.com` / `student123`
3. **Check browser console** for errors
4. **Test functionality**:
   - Create outpass request
   - View dashboards
   - Check QR generation

---

## Environment Variables Reference

Set these in **Netlify Dashboard → Site settings → Environment variables**:

### Required Variables

| Variable | Value | Example |
|----------|-------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Random secret (32+ chars) | `openssl rand -hex 32` |
| `VITE_API_BASE_URL` | API endpoint | `/api` (if using Netlify functions) or `https://backend.fly.dev/api` |
| `ENVIRONMENT` | Environment mode | `production` |
| `CORS_ORIGINS` | Frontend URL | `https://your-site.netlify.app` |

### Optional Variables

| Variable | Value | Default |
|----------|-------|---------|
| `ML_API_URL` | ML service URL | Falls back to mock |
| `USE_ML_PREDICTION` | Enable ML | `false` (uses mock) |

---

## Deployment Architectures

### Architecture 1: Netlify Only (Simplest)

```
Netlify (Frontend + Mock Backend)
└── Supabase (Database)
```

**Limitations:**
- Mock ML predictions only
- Limited backend functionality

**Best for:** Quick demo, testing

---

### Architecture 2: Netlify + Fly.io (Recommended)

```
Netlify (Frontend)
├── Fly.io (Backend + ML)
└── Supabase (Database)
```

**Benefits:**
- ✅ Full FastAPI backend
- ✅ Real ML predictions
- ✅ All features working
- ✅ All free tiers

**Deploy:**
```bash
# Frontend to Netlify
netlify deploy --prod

# Backend to Fly.io
cd backend-fastapi
flyctl launch
flyctl deploy
```

---

## Troubleshooting

### Build Fails on Netlify

**Check:**
- Build logs in Netlify dashboard
- Ensure `frontend/package.json` has correct scripts
- Verify Node version (18+)

**Fix:**
```bash
# Test build locally
cd frontend
npm install
npm run build
```

### Frontend Shows Blank Page

**Check:**
- Browser console for errors
- Network tab for failed requests
- Ensure `VITE_API_BASE_URL` is set

**Fix:**
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Clear Netlify cache and redeploy

### API Calls Fail (404)

**Check:**
- `VITE_API_BASE_URL` environment variable
- Backend is deployed and running
- CORS is configured correctly

**Fix:**
- If using separate backend, ensure URL is correct
- Check backend logs for errors

### Database Connection Error

**Check:**
- `DATABASE_URL` is set correctly
- Database is accessible (not behind firewall)
- Connection string format is correct

**Fix:**
- Test connection string locally first
- Ensure PostgreSQL (not SQLite) is used

---

## Custom Domain (Optional)

1. **Netlify Dashboard → Domain settings**
2. **Add custom domain**
3. **Update DNS records** (Netlify provides instructions)
4. **Update CORS_ORIGINS** to include custom domain

---

## Continuous Deployment

Netlify automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Netlify auto-deploys in 2-3 minutes
```

---

## Cost Summary

| Service | Cost | Credit Card Required |
|---------|------|---------------------|
| **Netlify** | Free | ❌ No |
| **Supabase** | Free | ❌ No |
| **Fly.io** (backend) | Free tier | ⚠️ Yes (but not charged) |

**Total: $0/month** with no credit card required for Netlify + Supabase!

---

## Next Steps

1. ✅ Sign up for Netlify (no credit card)
2. ✅ Create Supabase database (no credit card)
3. ✅ Deploy to Netlify via dashboard or CLI
4. ✅ Set environment variables
5. ✅ Test deployment
6. 🔄 (Optional) Deploy backend to Fly.io for full features

---

## Support

- **Netlify Docs**: https://docs.netlify.com
- **Netlify Community**: https://answers.netlify.com
- **Supabase Docs**: https://supabase.com/docs

---

**Ready to deploy! No credit card required! 🚀**
