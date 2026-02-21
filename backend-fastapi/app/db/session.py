import sqlalchemy.exc
from sqlmodel import SQLModel, create_engine, Session, text

from app.core.config import DATABASE_URL

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)


def init_db() -> None:
    # 1. Create any missing tables (e.g. StudentBehavioralStats)
    SQLModel.metadata.create_all(engine)

    # 2. Add any newly added columns to existing tables (poor man's Alembic for demo)
    new_pass_columns = [
        "out_at TIMESTAMP",
        "in_at TIMESTAMP",
        "returned_at TIMESTAMP",
        "parent_comments TEXT",
        "admin_comments TEXT",
        "parent_decided_at TIMESTAMP",
        "admin_decided_at TIMESTAMP",
        "risk_score NUMERIC(6, 2)",
        "risk_category VARCHAR(10)",
    ]

    with Session(engine) as session:
        for col_def in new_pass_columns:
            col_name = col_def.split()[0]
            try:
                # Add column if it doesn't exist
                session.exec(text(f"ALTER TABLE passes ADD COLUMN {col_def}"))
                session.commit()
            except sqlalchemy.exc.OperationalError as e:
                # Column likely already exists (or syntax error on SQLite vs Postgres)
                # Rollback the transaction to continue
                session.rollback()
                pass
        
        # Make sure student behavioral stats table can be created/altered later if needed


def get_session():
    with Session(engine) as session:
        yield session


