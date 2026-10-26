"""Database connectivity (Supabase Postgres, serverless-safe).

Uses the Supabase transaction-mode connection pooler: small per-instance pool,
SSL required, prepared statements disabled where the driver requires it.
Migrations run on a separate path that supports full session semantics.
"""

from collections.abc import Generator
from contextlib import contextmanager

from psycopg_pool import ConnectionPool

from app.core.logging import get_logger
from app.core.settings import settings

logger = get_logger("db")

_pool: ConnectionPool | None = None


def get_pool() -> ConnectionPool:
    global _pool
    if _pool is None:
        _pool = ConnectionPool(
            conninfo=settings.database_url,
            min_size=1,
            max_size=5,  # serverless: keep per-instance pool small
            max_idle=60,
            open=True,
            kwargs={"options": "-c statement_timeout=15000"},
        )
    return _pool


@contextmanager
def get_connection() -> Generator:
    pool = get_pool()
    with pool.connection() as conn:
        yield conn


def db_health() -> bool:
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("select 1")
                cur.fetchone()
        return True
    except Exception as exc:  # noqa: BLE001
        logger.warning("db_health_failed", error=str(exc))
        return False
