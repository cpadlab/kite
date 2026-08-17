import inspect
import logging
import sys
from pprint import pformat
from loguru import logger

from app.core.config import settings


class InterceptHandler(logging.Handler):
    """
    Custom logging handler to intercept standard Python logs and redirect to Loguru.

    Unifies logs across frameworks and third-party libraries (e.g., Uvicorn,
    FastAPI, SQLAlchemy, AsyncPG) into a single Loguru output sink.
    """

    def emit(self, record: logging.LogRecord) -> None:
        """
        Emit a standard logging record through Loguru.

        Determines the appropriate Loguru log level and dynamically locates
        the origin caller frame to preserve accurate filename, function,
        and line number metadata.

        Args:
            record: The standard library log record to process.
        """
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        frame, depth = inspect.currentframe(), 0
        while frame and (depth == 0 or frame.f_code.co_filename == logging.__file__):
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(
            level, record.getMessage()
        )


def format_record(record: dict) -> str:
    """
    Generate a dynamic log format string for development environments.

    Builds a colorized format containing timestamp, log level, caller location,
    and contextual tracing metadata (`tenant_id`, `request_id`) if present.

    Args:
        record: The Loguru log record dictionary.

    Returns:
        The formatted string template ready for Loguru rendering.
    """
    format_str = (
        "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
    )

    extra = record.get("extra", {})
    if "tenant_id" in extra or "request_id" in extra:
        tenant = extra.get("tenant_id", "no-tenant")
        req = extra.get("request_id", "no-req")
        format_str += f"<magenta>[{tenant} | {req}]</magenta> "

    format_str += "- <level>{message}</level>\n"

    if record.get("exception"):
        format_str += "{exception}\n"

    return format_str


def setup_logging() -> None:
    """
    Initialize and configure the global application logging pipeline.

    Clears default Loguru sinks and applies environment-specific configurations:
    - Production: Serialized JSON to `sys.stdout` for ingestion platforms
      (e.g., Datadog, Grafana Loki, AWS CloudWatch).
    - Development: Colorized, human-readable console output with enhanced tracebacks.

    Also hooks :class:`InterceptHandler` into root and framework loggers
    (Uvicorn, FastAPI, SQLAlchemy) to ensure unified log ingestion.
    Typically invoked during the FastAPI lifespan startup event.
    """
    logger.remove()

    is_production = getattr(settings, "ENVIRONMENT", "development") == "production"
    log_level = "INFO" if is_production else "DEBUG"

    if is_production:
        logger.add(sys.stdout, level=log_level, serialize=True, backtrace=False, diagnose=False)
    else:
        logger.add(sys.stdout, level=log_level, format=format_record, colorize=True, backtrace=True, diagnose=True)

    logging.root.handlers = [InterceptHandler()]
    logging.root.setLevel(log_level)

    for logger_name in (
        "uvicorn",
        "uvicorn.error",
        "uvicorn.access",
        "fastapi",
        "sqlalchemy.engine",
    ):
        mod_logger = logging.getLogger(logger_name)
        mod_logger.handlers = [InterceptHandler()]
        mod_logger.propagate = False


log = logger