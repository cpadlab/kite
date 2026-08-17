from fastapi import APIRouter, status
from app.core.config import settings

router = APIRouter(tags=["Infrastructure"])


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check() -> dict[str, str]:
    """
    GET /health
    -
    Liveness and basic readiness probe for load balancers and orchestrators,
    returning the current operational status and active environment.
    """
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
    }