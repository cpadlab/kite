import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.shared.logger import log


class RequestContextMiddleware(BaseHTTPMiddleware):
    """
    Middleware to inject distributed tracing identifiers, measure execution latency,
    and manage structured access logging.

    Extracts or generates an `X-Request-ID` header, binds it to contextual logger instances,
    calculates total processing duration in milliseconds, and attaches metric headers to the
    outgoing response.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        """
        Process an incoming HTTP request through the middleware pipeline.

        Args:
            request: The incoming Starlette/FastAPI request.
            call_next: The endpoint or downstream middleware handler.

        Returns:
            Response: The HTTP response enriched with tracking headers (`X-Request-ID`,
            `X-Process-Time-Ms`).
        """
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        start_time = time.perf_counter()

        req_logger = log.bind(request_id=request_id)

        response: Response = await call_next(request)

        process_time = (time.perf_counter() - start_time) * 1000
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"

        if request.url.path != "/health" or response.status_code >= 400:
            req_logger.info(
                f"{request.method} {request.url.path} - {response.status_code} ({process_time:.2f}ms)"
            )

        return response