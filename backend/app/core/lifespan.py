from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlalchemy import text
from app.controllers.seed import seed_root_user
from app.core.config import settings
from app.database.clickhouse import close_clickhouse, init_clickhouse
from app.database.postgres import engine, AsyncSessionLocal
from app.database.redis import close_redis, init_redis
from app.shared.logger import log, setup_logging
import asyncio
from app.controllers.iam.api_key import check_api_key_expiration_reminders


async def _api_key_expiration_scheduler():
    """
    """
    while True:
        try:
            async with AsyncSessionLocal() as session:
                await check_api_key_expiration_reminders(session)
        except Exception as exc:
            log.error(f"Error checking API key expiration reminders: {exc}")
        await asyncio.sleep(3600)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """
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

        await seed_root_user()

    except Exception as exc:
        log.critical(f"Database initialization failed during startup: {exc}")
        raise exc

    reminder_task = asyncio.create_task(_api_key_expiration_scheduler())

    log.info("API startup complete. Ready to receive traffic.")
    yield

    log.info("Shutting down application resources...")
    reminder_task.cancel()
    await close_clickhouse()
    await close_redis()
    await engine.dispose()

    log.info("All database connections and connection pools disposed.")