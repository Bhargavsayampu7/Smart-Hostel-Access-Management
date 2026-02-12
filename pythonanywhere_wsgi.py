# WSGI Configuration for PythonAnywhere
# This file should be placed at: /var/www/yourusername_pythonanywhere_com_wsgi.py

import sys
import os

# Add your project directory to the sys.path
# IMPORTANT: Replace 'yourusername' with your actual PythonAnywhere username
project_home = '/home/yourusername/Smart-Hostel-Access-Management/backend-fastapi'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Set environment variables
# IMPORTANT: Update these values with your actual configuration

# Database connection string from Supabase
os.environ['DATABASE_URL'] = 'postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres'

# JWT secret for authentication (generate with: openssl rand -hex 32)
os.environ['JWT_SECRET'] = 'your-jwt-secret-32-chars-minimum-change-this'

# CORS origins - your Netlify frontend URL
os.environ['CORS_ORIGINS'] = 'https://remarkable-creponne-22cc7b.netlify.app'

# Environment mode
os.environ['ENVIRONMENT'] = 'production'

# ML service URL (empty for mock predictions)
os.environ['ML_API_URL'] = ''

# Use mock ML predictions
os.environ['USE_ML_PREDICTION'] = 'false'

# Import the FastAPI app
# The variable name MUST be 'application' for PythonAnywhere
from app.main import app as application

# Optional: Print confirmation (visible in error log)
print("FastAPI app loaded successfully!")
print(f"CORS Origins: {os.environ.get('CORS_ORIGINS')}")
print(f"Environment: {os.environ.get('ENVIRONMENT')}")
