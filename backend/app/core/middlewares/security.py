import secrets
import time
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from redis.asyncio import Redis

from app.core.config import settings
from app.database.redis import _redis_pool
from app.shared.logger import log


class SecurityMiddleware(BaseHTTPMiddleware):
    """
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        """
        """
        if request.method == "OPTIONS":
            return await call_next(request)

        path = request.url.path

        if path == "/health":
            return await call_next(request)

        csrf_cookie = request.cookies.get("csrf_token")
        csrf_token = csrf_cookie
        new_csrf_generated = False

        if not csrf_token:
            csrf_token = secrets.token_hex(32)
            new_csrf_generated = True

        if request.method in ("POST", "PUT", "PATCH", "DELETE"):
            if not path.endswith("/auth/login"):
                csrf_header = request.headers.get("X-CSRF-Token")
                if not csrf_cookie or not csrf_header or csrf_cookie != csrf_header:
                    log.warning(
                        f"CSRF verification failed for {request.method} {path} "
                        f"from IP {request.client.host if request.client else 'Unknown'}"
                    )
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "CSRF verification failed. Token missing or mismatch."}
                    )

        if path.startswith("/api/"):
            client_time_str = request.headers.get("X-Kite-Client-Time")
            nonce = request.headers.get("X-Kite-Request-Nonce")

            if not client_time_str or not nonce:
                log.warning(f"Security check failed: missing headers for {path}")
                return JSONResponse(
                    status_code=400,
                    content={"detail": "Security headers missing."}
                )

            try:
                client_time_ms = int(client_time_str)
                client_time_sec = client_time_ms / 1000.0
                current_time_sec = time.time()

                if abs(current_time_sec - client_time_sec) > settings.MAX_SKEW_SECONDS:
                    log.warning(
                        f"Security check failed: expired timestamp skew from IP "
                        f"{request.client.host if request.client else 'Unknown'}"
                    )
                    return JSONResponse(
                        status_code=400,
                        content={
                            "detail": "Request timestamp expired or server clock desynchronized."
                        }
                    )
            except ValueError:
                return JSONResponse(
                    status_code=400,
                    content={"detail": "Invalid client timestamp format."}
                )

            if _redis_pool is not None:
                redis_client = Redis(connection_pool=_redis_pool)
                try:
                    nonce_key = f"nonce:{nonce}"
                    is_replay = await redis_client.get(nonce_key)
                    if is_replay:
                        log.warning(
                            f"Security check failed: replay attack detected with nonce {nonce} "
                            f"from IP {request.client.host if request.client else 'Unknown'}"
                        )
                        return JSONResponse(
                            status_code=403,
                            content={"detail": "Replay attack detected."}
                        )
                    
                    await redis_client.setex(nonce_key, settings.MAX_SKEW_SECONDS, "1")
                except Exception as e:
                    log.error(f"Dragonfly/Redis error during nonce check: {e}")
                finally:
                    await redis_client.aclose()

        response = await call_next(request)

        response.headers["X-CSRF-Token"] = csrf_token

        if new_csrf_generated or csrf_cookie is None:
            response.set_cookie(
                key="csrf_token",
                value=csrf_token,
                httponly=False,
                samesite="lax",
                secure=settings.ENVIRONMENT != "development",
            )

        return response
