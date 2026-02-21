#!/usr/bin/env python3
"""
reset_demo_data.py
Truncates demo-polluting tables (passes, violations, scan_events,
student_behavioral_stats, qr_tokens, location_points, approvals)
but KEEPS the users, students, parents tables intact.

Run from backend-fastapi/ directory:
  python reset_demo_data.py
"""
import sqlite3, os, sys

DB_PATH = os.path.join(os.path.dirname(__file__), "dev.db")

TABLES_TO_CLEAR = [
    "student_behavioral_stats",
    "violations",
    "scan_events",
    "location_points",
    "approvals",
    "qr_tokens",
    "passes",
]

def reset():
    if not os.path.exists(DB_PATH):
        print(f"[ERROR] DB not found at {DB_PATH}")
        sys.exit(1)

    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()

    cur.execute("PRAGMA foreign_keys = OFF")
    for table in TABLES_TO_CLEAR:
        cur.execute(f"DELETE FROM {table}")
        print(f"  ✓ Cleared {table} ({cur.rowcount} rows deleted)")

    cur.execute("PRAGMA foreign_keys = ON")
    con.commit()
    con.close()

    users = sqlite3.connect(DB_PATH).execute("SELECT role, name FROM users").fetchall()
    print(f"\n✅ Reset complete. Users retained: {[(u[0], u[1]) for u in users]}")

if __name__ == "__main__":
    print("Resetting demo data...")
    reset()
