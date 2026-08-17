from collections.abc import AsyncGenerator
import clickhouse_connect
from clickhouse_connect.driver.asyncclient import AsyncClient
from clickhouse_connect.driver.exceptions import ClickHouseError

from app.core.config import settings
from app.shared.logger import log


class ClickHouseManager:
    """
    ClickHouse client lifecycle manager.

    Maintains a reusable asynchronous client instance optimized for bulk ingestion
    and high-throughput analytical queries.
    """

    def __init__(self) -> None:
        """
        Initialize the ClickHouse manager with an unset client state.
        """
        self._client: AsyncClient | None = None


    async def connect(self) -> AsyncClient:
        """
        Establish and validate an asynchronous connection to ClickHouse.

        Reuses the existing connection if already initialized. If not, it instantiates
        a new `AsyncClient` using application configuration settings and verifies
        connectivity via a ping check.

        Returns:
            AsyncClient: An active ClickHouse asynchronous client.

        Raises:
            ConnectionError: If the server ping response evaluates to False.
            ClickHouseError: If a driver-level ClickHouse communication error occurs.
            Exception: For any other unexpected initialization failures.
        """
        if self._client is None:
            try:
                
                self._client = await clickhouse_connect.get_async_client(
                    host=settings.CLICKHOUSE_HOST, port=settings.CLICKHOUSE_PORT, username=settings.CLICKHOUSE_USER,
                    password=settings.CLICKHOUSE_PASSWORD, database=settings.CLICKHOUSE_DB, connect_timeout=10,
                    send_receive_timeout=30, compress=True,
                )

                is_alive = await self._client.ping()
                if not is_alive:
                    raise ConnectionError("ClickHouse server ping failed (returned False).")

                log.info("ClickHouse connection successfully established.")

            except (ClickHouseError, Exception) as exc:
                log.error(f"Failed to initialize ClickHouse client: {exc}")
                self._client = None
                raise exc

        return self._client


    async def close(self) -> None:
        """
        Close the active ClickHouse connection and reset the client state.
        """
        if self._client is not None:
            await self._client.close()
            self._client = None
            log.info("ClickHouse connection closed.")


    @property
    def client(self) -> AsyncClient:
        """
        Get the active ClickHouse client instance.

        Returns:
            AsyncClient: The active ClickHouse client.

        Raises:
            RuntimeError: If accessed before `connect()` has been executed.
        """
        if self._client is None:
            raise RuntimeError("ClickHouse client is not initialized. Ensure `connect()` is called during application lifespan startup.")
        return self._client


ch_manager = ClickHouseManager()


async def get_clickhouse() -> AsyncGenerator[AsyncClient, None]:
    """
    FastAPI dependency provider for ClickHouse operations.

    Yields:
        AsyncClient: An active ClickHouse asynchronous client.

    Raises:
        Exception: Re-raises any exception that occurs during client retrieval or usage.
    """
    try:
        client = await ch_manager.connect()
        yield client
    except Exception as exc:
        log.error(f"Error occurred during ClickHouse session: {exc}")
        raise


async def init_clickhouse() -> None:
    """
    Lifespan startup hook to pre-initialize the ClickHouse connection.
    """
    await ch_manager.connect()


async def close_clickhouse() -> None:
    """
    Lifespan shutdown hook to gracefully close the ClickHouse connection.
    """
    await ch_manager.close()