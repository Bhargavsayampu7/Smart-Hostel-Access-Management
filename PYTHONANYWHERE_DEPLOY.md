# PythonAnywhere Backend Deployment Guide

## 🎯 Deploy FastAPI Backend to PythonAnywhere (Free, No Credit Card)

PythonAnywhere is perfect for hosting your FastAPI backend - it's free, reliable, and doesn't require payment information.

---

## Step 1: Create PythonAnywhere Account (2 minutes)

1. Go to [pythonanywhere.com](https://www.pythonanywhere.com)
2. Click **"Start running Python online in less than a minute!"**
3. Click **"Create a Beginner account"** (Free forever)
4. Fill in:
   - Username: (choose your username)
   - Email: (your email)
   - Password: (create password)
5. Click **"Register"**
6. Verify your email

---

## Step 2: Upload Your Backend Code (5 minutes)

### Option A: Upload via Web Interface (Easiest)

1. **Go to Files tab** in PythonAnywhere dashboard
2. **Navigate to**: `/home/yourusername/`
3. **Create directory**: Click "New directory" → Name it `hostel-backend`
4. **Upload files**:
   - Click into `hostel-backend` folder
   - Upload all files from your local `backend-fastapi` folder
   - You can drag & drop or use "Upload a file" button

### Option B: Clone from GitHub (Recommended)

1. **Go to Consoles tab** → **Start a new console** → **Bash**
2. **Clone your repository**:
   ```bash
   git clone https://github.com/Bhargavsayampu7/Smart-Hostel-Access-Management.git
   cd Smart-Hostel-Access-Management/backend-fastapi
   ```

---

## Step 3: Install Dependencies (3 minutes)

1. **In the Bash console**, run:
   ```bash
   cd ~/Smart-Hostel-Access-Management/backend-fastapi
   pip3.10 install --user -r requirements.txt
   ```

2. **Wait for installation** (2-3 minutes)

---

## Step 4: Set Up Database (5 minutes)

### Option A: Use Supabase (Recommended - Already Set Up)

If you already created a Supabase database for Netlify, reuse it!

### Option B: Create New Supabase Database

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings → Database

---

## Step 5: Create WSGI Configuration File (3 minutes)

1. **Go to Web tab** in PythonAnywhere
2. Click **"Add a new web app"**
3. Click **"Next"**
4. Select **"Manual configuration"**
5. Select **Python 3.10**
6. Click **"Next"**

7. **Scroll down to "Code" section**
8. Click on **WSGI configuration file** link (e.g., `/var/www/yourusername_pythonanywhere_com_wsgi.py`)

9. **Delete all content** and replace with this:

```python
import sys
import os

# Add your project directory to the sys.path
project_home = '/home/yourusername/Smart-Hostel-Access-Management/backend-fastapi'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Set environment variables
os.environ['DATABASE_URL'] = 'postgresql://your-supabase-connection-string'
os.environ['JWT_SECRET'] = 'your-jwt-secret-here'
os.environ['CORS_ORIGINS'] = 'https://remarkable-creponne-22cc7b.netlify.app'
os.environ['ENVIRONMENT'] = 'production'
os.environ['ML_API_URL'] = ''

# Import the FastAPI app
from app.main import app as application
```

10. **Replace**:
    - `yourusername` with your actual PythonAnywhere username
    - `DATABASE_URL` with your Supabase connection string
    - `JWT_SECRET` with a random secret (run `openssl rand -hex 32` locally)
    - `CORS_ORIGINS` with your Netlify URL

11. Click **"Save"**

---

## Step 6: Configure Virtual Environment (2 minutes)

1. **Still in Web tab**, scroll to **"Virtualenv"** section
2. **Enter path**: `/home/yourusername/.local`
3. Click **"OK"**

---

## Step 7: Set Static Files (Optional)

1. **In Web tab**, scroll to **"Static files"** section
2. Leave as default (not needed for API-only backend)

---

## Step 8: Reload Web App (1 minute)

1. **Scroll to top** of Web tab
2. Click big green **"Reload yourusername.pythonanywhere.com"** button
3. Wait 10-20 seconds

---

## Step 9: Test Your Backend! 🎉

1. **Visit**: `https://yourusername.pythonanywhere.com/docs`
2. You should see the **FastAPI Swagger UI**!
3. **Test health endpoint**: `https://yourusername.pythonanywhere.com/api/health`

---

## Step 10: Update Netlify Frontend (2 minutes)

1. **Go to Netlify Dashboard**
2. Your site → **Site settings** → **Environment variables**
3. **Edit** `VITE_API_BASE_URL`:
   - New value: `https://yourusername.pythonanywhere.com/api`
4. **Save**
5. **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

---

## Step 11: Test Full Stack App! 🚀

1. **Visit your Netlify site**: `https://remarkable-creponne-22cc7b.netlify.app`
2. **Login**:
   - Email: `student@test.com`
   - Password: `student123`
3. **Should work!** ✅

---

## Environment Variables Summary

Add these to your WSGI configuration file:

```python
os.environ['DATABASE_URL'] = 'postgresql://postgres.[ref]:[password]@aws-0-us-west-1.pooler.supabase.com:5432/postgres'
os.environ['JWT_SECRET'] = 'your-32-char-random-secret'
os.environ['CORS_ORIGINS'] = 'https://remarkable-creponne-22cc7b.netlify.app'
os.environ['ENVIRONMENT'] = 'production'
os.environ['ML_API_URL'] = ''  # Empty for mock predictions
```

---

## Troubleshooting

### "ImportError: No module named 'app'"

**Fix**: Check that `project_home` path is correct in WSGI file:
```python
project_home = '/home/yourusername/Smart-Hostel-Access-Management/backend-fastapi'
```

### "Database connection error"

**Fix**: 
1. Check `DATABASE_URL` is correct in WSGI file
2. Ensure Supabase database is running
3. Test connection string locally first

### "CORS error" in browser

**Fix**:
1. Ensure `CORS_ORIGINS` in WSGI file matches your Netlify URL exactly
2. Reload web app after changing

### "502 Bad Gateway"

**Fix**:
1. Check error log: Web tab → Error log
2. Usually means Python import error
3. Verify all dependencies are installed

---

## Free Tier Limitations

- **CPU seconds**: 100 seconds/day (resets daily)
- **Disk space**: 512 MB
- **Always on**: No (sleeps after inactivity, wakes on request)
- **Custom domain**: Not on free tier
- **HTTPS**: ✅ Included (automatic)

**For your app**: This is plenty! The free tier works great for demos and small projects.

---

## Viewing Logs

1. **Web tab** → **Log files** section
2. **Error log**: Shows Python errors
3. **Server log**: Shows requests
4. **Access log**: Shows all HTTP requests

---

## Updating Your Code

### Method 1: Git Pull (Recommended)

```bash
# In Bash console
cd ~/Smart-Hostel-Access-Management
git pull origin main
```

Then reload web app.

### Method 2: Upload Files

1. Files tab → Navigate to your folder
2. Upload changed files
3. Reload web app

---

## Your Architecture

```
User Browser
    ↓
Netlify (Frontend - React)
    ↓ API calls
PythonAnywhere (Backend - FastAPI)
    ↓
Supabase (Database - PostgreSQL)
```

**All free, no credit card required!** 🎉

---

## Quick Commands Reference

```bash
# Install dependencies
pip3.10 install --user -r requirements.txt

# Update code from Git
cd ~/Smart-Hostel-Access-Management
git pull origin main

# Check Python version
python3.10 --version

# Test import
python3.10 -c "from app.main import app; print('OK')"
```

---

## Next Steps After Deployment

1. ✅ Test all features (login, create request, QR codes)
2. ✅ Monitor error logs for issues
3. ✅ Set up custom domain (optional, paid feature)
4. ✅ Consider upgrading if you need more CPU time

---

**Ready to deploy! Follow the steps above.** 🚀

**Your backend will be at**: `https://yourusername.pythonanywhere.com`
