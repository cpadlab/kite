import logging
from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings
from app.shared.logger import log


engine: AsyncEngine = create_async_engine(
    settings.POSTGRES_DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy declarative models in the application.
    """
    pass


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Provide an asynchronous database session context.

    Yields an active `AsyncSession` for executing database operations. Automatically
    rolls back pending transactions and logs the error if an unhandled exception
    occurs, ensuring the session is properly closed upon exit.

    Yields:
        AsyncSession: An active asynchronous database session.

    Raises:
        Exception: Re-raises any exception encountered during the session lifecycle
            after executing a rollback.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            log.error(f"Transaction rollback executed due to an exception: {e}")
            raise
        finally:
            await session.close()