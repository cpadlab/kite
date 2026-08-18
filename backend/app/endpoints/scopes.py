from fastapi import APIRouter, Depends, status
from app.core.security import get_current_user
from app.core.scopes import get_scopes_registry, get_all_valid_scopes
from app.models.iam import User

router = APIRouter(prefix="/scopes", tags=["System Scopes Registry"])


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    summary="Get all registered system scopes and categories",
)
async def get_system_scopes(
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    GET /scopes
    -
    Returns the complete list of system scopes structured by module/group.
    Used by frontend forms and API key generators.
    """
    return {
        "scopes": get_scopes_registry(),
        "valid_scopes": get_all_valid_scopes(),
    }
