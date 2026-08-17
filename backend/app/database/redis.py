
from collections.abc import AsyncGenerator
from redis.asyncio import ConnectionPool, Redis

from app.core.config import settings
from app.shared.logger import log

_redis_pool: ConnectionPool | None = None


async def init_redis() -> Redis:
    """
    Initialize the Dragonfly/Redis connection pool and validate connectivity.

    Creates a global connection pool with configured limits and timeouts, then executes
    an initial ping check to ensure the backend is reachable. Should be invoked during
    the FastAPI lifespan startup event.

    Returns:
        Redis: An active asynchronous Redis client bound to the global pool.

    Raises:
        Exception: If the connection pool creation or initial ping fails.
    """
    global _redis_pool
    if _redis_pool is None:
        try:

            _redis_pool = ConnectionPool.from_url(
                settings.REDIS_URL,
                max_connections=settings.REDIS_MAX_CONNECTIONS,
                decode_responses=settings.REDIS_DECODE_RESPONSES,
                socket_timeout=settings.REDIS_SOCKET_TIMEOUT,
                socket_connect_timeout=settings.REDIS_SOCKET_CONNECT_TIMEOUT,
                health_check_interval=settings.REDIS_HEALTH_CHECK_INTERVAL,
            )
            client = Redis(connection_pool=_redis_pool)

            await client.ping()
            log.info(f"Successfully connected to Dragonfly/Redis ({settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB})")

            return client

        except Exception as e:
            log.error(f"Failed to connect to Dragonfly/Redis: {e}")
            raise e

    return Redis(connection_pool=_redis_pool)


async def close_redis() -> None:
    """
    Close and disconnect the Dragonfly/Redis connection pool on application shutdown.
    """
    global _redis_pool
    if _redis_pool is not None:
        await _redis_pool.disconnect()
        _redis_pool = None
        log.info("Dragonfly/Redis connection pool closed successfully.")


async def get_redis() -> AsyncGenerator[Redis, None]:
    """
    FastAPI dependency provider for Redis clients.

    Retrieves a client utilizing the shared connection pool and automatically
    closes the client interface once the request context concludes.

    Yields:
        Redis: An asynchronous Redis client instance.
    """
    if _redis_pool is None:
        await init_redis()

    client = Redis(connection_pool=_redis_pool)

    try:
        yield client
    finally:
        await client.aclose()