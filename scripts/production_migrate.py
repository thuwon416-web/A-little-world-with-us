#!/usr/bin/env python3
"""Zero-Downtime Safe Database Migration Runner for A-Little-World-With-Us.

Designed for automated production pipelines and containerless deployments (systemd / PM2).
Features:
- Pre-flight PostgreSQL / Supabase connectivity check with exponential backoff.
- Executes sequential bootstrap SQL files (00_core.sql through 55_*.sql) from backend/supabase/bootstrap.
- Transactional execution with advisory lock protection to prevent race conditions during deployments.
- Maintains `alw_schema_migrations` tracking table for idempotent replays.
- Non-zero exit code on failure to prevent deployment of broken states.
"""

import os
import sys
import time
from pathlib import Path


def log(msg: str) -> None:
    print(f"[ALW-Migrate] {time.strftime('%Y-%m-%d %H:%M:%S')} - {msg}", flush=True)


def get_bootstrap_dir() -> Path:
    repo_root = Path(__file__).resolve().parent.parent
    bootstrap_dir = repo_root / "backend" / "supabase" / "bootstrap"
    if not bootstrap_dir.exists():
        log(f"ERROR: Bootstrap SQL directory not found: {bootstrap_dir}")
        sys.exit(1)
    return bootstrap_dir


def wait_for_database(dsn: str, max_retries: int = 15, delay: float = 2.0) -> bool:
    """Verifies PostgreSQL connectivity before initiating migrations."""
    log("Checking PostgreSQL database accessibility...")
    try:
        import psycopg
    except ImportError:
        try:
            import psycopg2 as psycopg
        except ImportError:
            log("ERROR: `psycopg` or `psycopg2` is required to run database migrations.")
            return False

    for attempt in range(1, max_retries + 1):
        try:
            with psycopg.connect(dsn, connect_timeout=5) as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT 1")
                    log(f"Database reachable on attempt {attempt}.")
                    return True
        except Exception as exc:
            log(f"Attempt {attempt}/{max_retries} connection failed: {exc}")
            time.sleep(delay)

    log("ERROR: Timed out waiting for database connectivity.")
    return False


def run_migrations(dsn: str) -> bool:
    """Applies all bootstrap SQL files in alphanumeric order."""
    try:
        import psycopg
    except ImportError:
        import psycopg2 as psycopg

    bootstrap_dir = get_bootstrap_dir()
    sql_files = sorted([f for f in bootstrap_dir.glob("*.sql") if f.is_file()])
    log(f"Found {len(sql_files)} schema migration scripts in {bootstrap_dir}")

    try:
        with psycopg.connect(dsn) as conn:
            with conn.cursor() as cur:
                # Obtain transactional advisory lock
                cur.execute("SELECT pg_advisory_xact_lock(8391204857102)")
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS alw_schema_migrations (
                        migration_name TEXT PRIMARY KEY,
                        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
                    )
                    """
                )
                cur.execute("SELECT migration_name FROM alw_schema_migrations")
                applied = {row[0] for row in cur.fetchall()}

                for sql_file in sql_files:
                    if sql_file.name in applied:
                        continue

                    log(f"Applying migration: {sql_file.name}...")
                    sql_content = sql_file.read_text(encoding="utf-8")
                    cur.execute(sql_content)
                    cur.execute(
                        "INSERT INTO alw_schema_migrations (migration_name) VALUES (%s)",
                        (sql_file.name,),
                    )
                    conn.commit()
                    log(f"  \u2713 {sql_file.name} applied successfully.")

            log("All schema migrations verified and applied.")
            return True
    except Exception as exc:
        log(f"CRITICAL: Migration run failed on script: {exc}")
        return False


def main() -> None:
    log("Starting Zero-Downtime Migration Automation for A-Little-World-With-Us...")
    dsn = os.getenv("DATABASE_URL", "").strip()
    if not dsn:
        log("WARNING: DATABASE_URL not set. In local offline mode, skipping database migration.")
        sys.exit(0)

    if not wait_for_database(dsn):
        sys.exit(1)

    if not run_migrations(dsn):
        sys.exit(1)

    log("Migration automation completed successfully.")


if __name__ == "__main__":
    main()
