from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlalchemy import text

from app.core.config import settings
from app.database.clickhouse import close_clickhouse, init_clickhouse
from app.database.postgres import engine
from app.database.redis import close_redis, init_redis
from app.shared.logger import log, setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Manage the asynchronous startup and shutdown lifecycles of the FastAPI application.

    **Startup:**
    - Configures application-wide logging handlers and formatters.
    - Validates connectivity to the PostgreSQL instance via a probe query (`SELECT 1`).
    - Initializes the ClickHouse client and Dragonfly/Redis connection pool.

    **Shutdown:**
    - Closes the ClickHouse client session.
    - Disconnects the Dragonfly/Redis connection pool.
    - Disposes of all active SQLAlchemy connection pools.

    Args:
        app: The running FastAPI application instance.

    Yields:
        None: Yields control back to FastAPI to begin processing incoming requests.

    Raises:
        Exception: If any database or cache connection fails during startup,
            aborting application initialization.
    """
    setup_logging()
    log.info(f"Starting {settings.ENVIRONMENT.upper()} environment...")

    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        log.info("PostgreSQL connection pool ready.")

        await init_clickhouse()
        await init_redis()

        log.info("All database engines connected successfully.")

    except Exception as exc:
        log.critical(f"Database initialization failed during startup: {exc}")
        raise exc

    log.info("API startup complete. Ready to receive traffic.")
    yield

    log.info("Shutting down application resources...")
    await close_clickhouse()
    await close_redis()
    await engine.dispose()

    log.info("All database connections and connection pools disposed.")