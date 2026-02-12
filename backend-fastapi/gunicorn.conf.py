"""
Gunicorn configuration file for production deployment.
Used by Render, Railway, and other platforms for running FastAPI with uvicorn workers.
"""
import os
import multiprocessing

# Server socket
bind = f"0.0.0.0:{os.getenv('PORT', '5001')}"
backlog = 2048

# Worker processes
# For CPU-bound tasks, use (2 * CPU_COUNT) + 1
# For I/O-bound tasks (like this API), can use more workers
workers = int(os.getenv("WEB_CONCURRENCY", multiprocessing.cpu_count() * 2 + 1))
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
timeout = 120
keepalive = 5

# Restart workers after this many requests (prevent memory leaks)
max_requests = 1000
max_requests_jitter = 50

# Logging
accesslog = "-"  # Log to stdout
errorlog = "-"   # Log to stderr
loglevel = os.getenv("LOG_LEVEL", "info")
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "hostel-backend"

# Server mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# SSL (if needed - usually handled by platform)
keyfile = None
certfile = None

# Preload app for better performance (workers share code)
preload_app = True

# Graceful timeout for worker restart
graceful_timeout = 30

# Development vs Production
if os.getenv("ENVIRONMENT") == "development":
    reload = True
    workers = 1
else:
    reload = False
