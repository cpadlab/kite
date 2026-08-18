from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.lifespan import lifespan
from app.core.middlewares.request_context import RequestContextMiddleware
from app.core.middlewares.security import SecurityMiddleware
from app.endpoints.auth import router as auth_router
from app.endpoints.health import router as health_router
from app.endpoints.tenant import router as tenant_router
from app.endpoints.api_key import router as api_key_router
from app.endpoints.scopes import router as scopes_router

api: FastAPI = FastAPI(
    title=settings.PROJECT_TITLE,
    version=settings.PROJECT_VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan,
)

app = api

api.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.cors_methods,
    allow_headers=settings.cors_headers,
    expose_headers=["X-CSRF-Token"],
)
api.add_middleware(RequestContextMiddleware)
api.add_middleware(SecurityMiddleware)

api.include_router(health_router)
api.include_router(auth_router, prefix="/api/v1")
api.include_router(tenant_router, prefix="/api/v1")
api.include_router(api_key_router, prefix="/api/v1")
api.include_router(scopes_router, prefix="/api/v1")