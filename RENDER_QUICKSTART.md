# Render Quick Start - Backend Only (10 Minutes)

Since your frontend is already on Netlify, we'll just deploy the **backend** to Render.

---

## Step 1: Create Render Account (2 min)

1. Go to [render.com](https://render.com)
2. Click **"Get Started"**
3. Sign up with GitHub (free, requires credit card but won't charge on free tier)
4. Verify email

---

## Step 2: Create PostgreSQL Database (2 min)

1. **Dashboard** → **New** → **PostgreSQL**
2. **Name**: `hostel-db`
3. **Database**: `hostel_db`
4. **User**: `hostel_user`
5. **Region**: Choose closest (e.g., Oregon, Singapore)
6. **Plan**: **Free**
7. Click **"Create Database"**
8. **Wait 1-2 minutes** for database to provision
9. **Copy "Internal Database URL"** (you'll need this)
   - It looks like: `postgresql://hostel_user:xxxxx@dpg-xxxxx-a/hostel_db`

---

## Step 3: Deploy Backend (5 min)

1. **Dashboard** → **New** → **Web Service**
2. **Connect GitHub repository**:
   - Click "Connect account" if needed
   - Select: `Bhargavsayampu7/Smart-Hostel-Access-Management`
3. **Configure**:
   - **Name**: `hostel-backend`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `backend-fastapi`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app.main:app -c gunicorn.conf.py`
4. **Plan**: **Free**
5. Click **"Advanced"** → **Add Environment Variables**:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | (paste Internal Database URL from Step 2) |
| `JWT_SECRET` | (generate below) |
| `CORS_ORIGINS` | `https://remarkable-creponne-22cc7b.netlify.app` |
| `ENVIRONMENT` | `production` |
| `ML_API_URL` | (leave empty) |

6. **Generate JWT_SECRET** - Run this locally:
```bash
openssl rand -hex 32
```
Copy the output and paste as `JWT_SECRET` value.

7. **Advanced** → **Health Check Path**: `/api/health`

8. Click **"Create Web Service"**

9. **Wait 5-10 minutes** for deployment (watch the logs)

---

## Step 4: Get Backend URL (1 min)

After deployment completes:

1. You'll see your backend URL at the top (e.g., `https://hostel-backend-xxxx.onrender.com`)
2. **Copy this URL**
3. **Test it**: Visit `https://hostel-backend-xxxx.onrender.com/docs`
   - You should see FastAPI Swagger UI ✅

---

## Step 5: Update Netlify Frontend (2 min)

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site (`remarkable-creponne-22cc7b`)
3. **Site settings** → **Environment variables**
4. **Edit** `VITE_API_BASE_URL`:
   - **New value**: `https://hostel-backend-xxxx.onrender.com/api` (your Render backend URL + `/api`)
5. **Save**
6. **Deploys** → **Trigger deploy** → **Clear cache and deploy site**
7. **Wait 2-3 minutes**

---

## Step 6: Update Backend CORS (1 min)

1. Go back to **Render Dashboard** → **hostel-backend**
2. **Environment** tab
3. **Edit** `CORS_ORIGINS`:
   - Change to: `https://remarkable-creponne-22cc7b.netlify.app`
4. **Save** (this triggers automatic redeploy)
5. **Wait 2-3 minutes**

---

## Step 7: Test Your App! 🎉

1. **Visit**: `https://remarkable-creponne-22cc7b.netlify.app`
2. **Login**:
   - Email: `student@test.com`
   - Password: `student123`
3. **Should work!** ✅

---

## Architecture

```
User Browser
    ↓
Netlify (Frontend - React)
    ↓ API calls
Render (Backend - FastAPI)
    ↓
Render PostgreSQL (Database)
```

**All free tier!** 🎉

---

## Troubleshooting

### "Service Unavailable" or 503 Error

**Cause**: Render free tier spins down after 15 min of inactivity.

**Fix**: First request takes ~30 seconds to wake up. Just wait and refresh.

### CORS Error

**Fix**: Make sure `CORS_ORIGINS` in Render matches your Netlify URL exactly.

### Database Connection Error

**Fix**: Verify `DATABASE_URL` in Render environment variables is the **Internal Database URL** from the PostgreSQL service.

---

## Free Tier Limitations

- **Backend**: Spins down after 15 min inactivity (30s cold start)
- **Database**: 1GB storage, 90 days inactivity limit
- **Bandwidth**: 100GB/month

**For production**: Upgrade to $7/month for always-on backend.

---

**Your backend will be at**: `https://hostel-backend-xxxx.onrender.com`

**Ready to deploy!** 🚀
