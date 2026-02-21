# Vercel Backend Deployment - Quick Guide

## 🎯 Goal
Deploy the FastAPI backend to Vercel to provide API endpoints for your Netlify frontend.

---

## Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

---

## Step 2: Login to Vercel

```bash
vercel login
```

This will open your browser - sign in with GitHub (no credit card required).

---

## Step 3: Set Up PostgreSQL Database

### Option A: Vercel Postgres (Easiest)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Storage** → **Create Database** → **Postgres**
3. Name: `hostel-db`
4. Region: Choose closest to you
5. Click **Create**
6. Copy the **POSTGRES_URL** (will be auto-injected)

### Option B: Use Supabase (Already Set Up)

If you already created a Supabase database for Netlify, you can reuse it!

---

## Step 4: Deploy Backend to Vercel

```bash
# Navigate to project root
cd /Users/bhargavteja/Downloads/final-hostel-system.zip

# Deploy to Vercel
vercel --prod

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? hostel-backend (or any name)
# - In which directory is your code? ./ (press Enter)
# - Override settings? No
```

---

## Step 5: Set Environment Variables in Vercel

After deployment, go to [Vercel Dashboard](https://vercel.com/dashboard):

1. Select your project (`hostel-backend`)
2. Go to **Settings** → **Environment Variables**
3. Add these variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | Your PostgreSQL connection string | From Supabase or Vercel Postgres |
| `POSTGRES_URL` | (auto-set if using Vercel Postgres) | Same as DATABASE_URL |
| `JWT_SECRET` | Random 32+ char string | Run: `openssl rand -hex 32` |
| `ENVIRONMENT` | `production` | |
| `CORS_ORIGINS` | `https://your-netlify-site.netlify.app` | Your Netlify frontend URL |
| `ML_API_URL` | (leave empty) | Will use mock predictions |

4. Click **Save**

---

## Step 6: Redeploy Backend

After adding environment variables:

```bash
vercel --prod
```

Or in Vercel dashboard: **Deployments** → **Redeploy**

---

## Step 7: Update Netlify Frontend

Get your Vercel backend URL (looks like: `https://hostel-backend.vercel.app`)

1. Go to **Netlify Dashboard**
2. Your site → **Site settings** → **Environment variables**
3. **Edit** `VITE_API_BASE_URL`:
   - Change from: `/api`
   - Change to: `https://hostel-backend.vercel.app/api`
4. **Save**
5. Go to **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

---

## Step 8: Test Your Deployment

1. Visit your **Netlify frontend**: `https://your-site.netlify.app`
2. Try to login: `student@test.com` / `student123`
3. Should work now! ✅

---

## Architecture

```
User Browser
    ↓
Netlify (Frontend - React)
    ↓ API calls
Vercel (Backend - FastAPI)
    ↓
PostgreSQL (Supabase or Vercel)
```

---

## Troubleshooting

### "CORS error"
- Ensure `CORS_ORIGINS` in Vercel matches your Netlify URL exactly
- Redeploy backend after updating

### "Database connection error"
- Check `DATABASE_URL` is set correctly in Vercel
- Ensure PostgreSQL is accessible

### "404 on API calls"
- Verify `VITE_API_BASE_URL` in Netlify points to Vercel backend
- Check Vercel backend is deployed and running

---

## Quick Commands Reference

```bash
# Deploy backend
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs

# Remove deployment (if needed)
vercel remove hostel-backend
```

---

**Ready to deploy! Follow the steps above.** 🚀
