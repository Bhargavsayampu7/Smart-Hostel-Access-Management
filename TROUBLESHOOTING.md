# Troubleshooting Vercel Deployment

## Common Issues and Solutions

### 500 Error on `/api/auth/login`

**Possible Causes:**

1. **Missing `DATABASE_URL` environment variable**
   - **Check**: Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - **Fix**: Ensure `DATABASE_URL` is set with your PostgreSQL connection string
   - Format: `postgresql+psycopg://user:password@host:5432/dbname`

2. **Database not connected to project**
   - **Check**: Go to Vercel Dashboard → Storage → Postgres → Your DB → Check if project is connected
   - **Fix**: Click "Connect Project" and select your project

3. **Database tables not initialized**
   - **Check**: Visit `https://your-project.vercel.app/api/health` - should return `{"status":"ok"}`
   - **Fix**: Tables auto-create on first API request. If still failing, check logs.

4. **Missing Python dependencies**
   - **Check**: Vercel Dashboard → Your Project → Functions → Logs
   - **Fix**: Ensure `api/requirements.txt` has all dependencies

### How to Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Project
2. Click on **"Functions"** tab
3. Click on **"api/index.py"**
4. View **"Logs"** tab
5. Look for error messages (red text)

### How to Verify Environment Variables

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Ensure these are set:
   - `DATABASE_URL` (PostgreSQL connection string - **REQUIRED**)
   - `JWT_SECRET` (random secret string - **REQUIRED**)
   - `ML_SERVICE_URL` (optional - only if ML service is deployed)

### Testing Database Connection

1. Visit: `https://your-project.vercel.app/api/health`
   - Should return: `{"status":"ok"}`
   - If 500 error, check function logs

2. Try login with demo credentials:
   - Email: `student@test.com`
   - Password: `student123`

### Common Error Messages

**"ModuleNotFoundError: No module named 'X'"**
- Solution: Add missing module to `api/requirements.txt`

**"OperationalError: could not connect to server"**
- Solution: Check `DATABASE_URL` is correct and database is accessible

**"Table 'users' does not exist"**
- Solution: Database tables auto-create on first request. Check logs for initialization errors.

**"Invalid credentials" (401)**
- Solution: Demo users seed on first login. If still failing, check database connection.
