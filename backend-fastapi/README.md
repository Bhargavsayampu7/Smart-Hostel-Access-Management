# FastAPI Backend (New Stack)

This is the **new** backend for the project migration (FastAPI + SQL DB).

## Quick start (dev)

1) Create a venv and install deps:

```bash
cd backend-fastapi
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2) Configure environment:

```bash
export DATABASE_URL="sqlite:///./dev.db"  # dev only
export JWT_SECRET="change-me"
export JWT_EXPIRE_MINUTES="10080" # 7 days
```

3) Run:

```bash
uvicorn app.main:app --reload --port 5002
```

API docs at `http://localhost:5002/docs`.

## Notes

- Use PostgreSQL in prod: `DATABASE_URL="postgresql+psycopg://user:pass@localhost:5432/hostel"`
- This backend will replace the Node/Mongo backend once feature-parity is reached.


