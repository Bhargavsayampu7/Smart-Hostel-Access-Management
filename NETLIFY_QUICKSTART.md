# 🚀 Quick Start: Netlify Deployment (No Credit Card!)

## Step 1: Set Up Free Database (2 minutes)

### Go to Supabase (No Credit Card Required)

1. Visit: https://supabase.com
2. Click **"Start your project"**
3. Sign in with GitHub
4. Click **"New project"**
5. Fill in:
   - Name: `hostel-system`
   - Database Password: (create a strong password - save it!)
   - Region: Choose closest to you
6. Click **"Create new project"**
7. Wait 2 minutes for database to provision

### Get Connection String

1. In Supabase dashboard → **Settings** → **Database**
2. Scroll to **Connection string** → **URI**
3. Copy the connection string (looks like):
   ```
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
   ```
4. **Replace `[YOUR-PASSWORD]` with your actual password**
5. Save this connection string - you'll need it!

---

## Step 2: Deploy to Netlify (3 minutes)

### Go to Netlify (No Credit Card Required)

1. Visit: https://app.netlify.com
2. Click **"Sign up"** → Sign in with GitHub
3. Click **"Add new site"** → **"Import an existing project"**
4. Click **"Deploy with GitHub"**
5. Authorize Netlify to access your GitHub
6. Select repository: `Smart-Hostel-Access-Management`

### Configure Build Settings

1. **Base directory**: `frontend`
2. **Build command**: `npm install && npm run build`
3. **Publish directory**: `frontend/dist`
4. Click **"Show advanced"** → **"New variable"**

### Add Environment Variables

Add these one by one:

| Variable Name | Value |
|---------------|-------|
| `DATABASE_URL` | (paste your Supabase connection string from Step 1) |
| `JWT_SECRET` | (generate with: `openssl rand -hex 32` in terminal) |
| `VITE_API_BASE_URL` | `/api` |
| `ENVIRONMENT` | `production` |
| `CORS_ORIGINS` | (leave empty for now, will update after deploy) |

5. Click **"Deploy site"**
6. Wait 2-3 minutes ☕

---

## Step 3: Update CORS (1 minute)

After deployment completes:

1. **Copy your Netlify URL** (looks like: `https://your-site-name.netlify.app`)
2. Go to **Site settings** → **Environment variables**
3. **Edit `CORS_ORIGINS`**:
   - Value: `https://your-site-name.netlify.app` (your actual URL)
4. Click **"Save"**
5. Go to **Deploys** → **Trigger deploy** → **"Deploy site"**
6. Wait 1-2 minutes

---

## Step 4: Test Your Deployment! 🎉

1. **Visit your Netlify URL**: `https://your-site-name.netlify.app`
2. **Click "Student" role**
3. **Login with**:
   - Email: `student@test.com`
   - Password: `student123`
4. **You should see the student dashboard!** ✅

### Test Features:
- ✅ Create outpass request
- ✅ View dashboard
- ✅ Generate QR code (after approval)

---

## Troubleshooting

### "Cannot connect to database"
- Check `DATABASE_URL` is correct
- Ensure you replaced `[YOUR-PASSWORD]` with actual password
- Verify Supabase project is running

### "CORS error" in browser console
- Ensure `CORS_ORIGINS` matches your Netlify URL exactly
- Redeploy after updating CORS_ORIGINS

### "Login failed"
- Database tables auto-create on first request
- Try refreshing and logging in again
- Check browser console for specific errors

---

## What's Working

✅ **Frontend**: Full React app  
✅ **Database**: PostgreSQL (Supabase)  
✅ **Authentication**: JWT-based login  
✅ **Mock ML**: Risk predictions (mock mode)  

## What's Limited

⚠️ **ML Predictions**: Using mock data (not real ML model)  
⚠️ **Backend**: Simplified (some advanced features may not work)

### To Enable Full Features:

Deploy backend separately on Fly.io (free tier):
```bash
cd backend-fastapi
flyctl launch
flyctl deploy
```

Then update `VITE_API_BASE_URL` in Netlify to point to Fly.io backend.

---

## 💰 Cost: $0/month

- Netlify: Free (no credit card)
- Supabase: Free (no credit card)
- **Total: $0** ✅

---

## Need Help?

See full guide: `NETLIFY_DEPLOY.md`

**You're live! 🚀 No credit card required!**
