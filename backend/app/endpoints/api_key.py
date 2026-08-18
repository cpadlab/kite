import uuid
from typing import Literal, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_tenant_owner_or_admin
from app.database.postgres import get_db_session
from app.models.iam import User
from app.schemas.iam.api_key import (
    ApiKeyCreateSchema,
    ApiKeyCreatedResponseSchema,
    PaginatedApiKeyResponseSchema,
)
from app.controllers.iam.api_key import (
    create_tenant_api_key,
    list_tenant_api_keys,
    revoke_tenant_api_key,
    rotate_tenant_api_key,
)

router = APIRouter(prefix="/tenants/current/api-keys", tags=["Tenant Platform API Keys Management"])


@router.post(
    "",
    response_model=ApiKeyCreatedResponseSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new platform API key for the current tenant (Owner & Admin only)",
)
async def create_api_key(
    payload: ApiKeyCreateSchema,
    current_user: User = Depends(get_current_tenant_owner_or_admin),
    db: AsyncSession = Depends(get_db_session),
) -> ApiKeyCreatedResponseSchema:
    """
    POST /tenants/current/api-keys
    -
    Generates a new platform API key for system-to-system integrations.
    Requires Tenant Owner or Admin authorization.
    Dispatches notification email to all tenant Owners and Admins.
    """
    return await create_tenant_api_key(payload=payload, session=db, current_user=current_user)


@router.get(
    "",
    response_model=PaginatedApiKeyResponseSchema,
    status_code=status.HTTP_200_OK,
    summary="List paginated tenant platform API keys (Owner & Admin only)",
)
async def get_api_keys(
    search: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    sort_order: Literal["asc", "desc"] = Query(default="desc"),
    current_user: User = Depends(get_current_tenant_owner_or_admin),
    db: AsyncSession = Depends(get_db_session),
) -> PaginatedApiKeyResponseSchema:
    """
    GET /tenants/current/api-keys
    -
    Returns a paginated list of platform API keys for the user's organization.
    Requires Tenant Owner or Admin authorization.
    """
    return await list_tenant_api_keys(
        session=db,
        current_user=current_user,
        page=page,
        page_size=page_size,
        search=search,
        sort_order=sort_order,
    )


@router.post(
    "/{key_id}/rotate",
    response_model=ApiKeyCreatedResponseSchema,
    status_code=status.HTTP_200_OK,
    summary="Rotate a platform API key (Owner & Admin only)",
)
async def rotate_api_key(
    key_id: uuid.UUID,
    current_user: User = Depends(get_current_tenant_owner_or_admin),
    db: AsyncSession = Depends(get_db_session),
) -> ApiKeyCreatedResponseSchema:
    """
    POST /tenants/current/api-keys/{key_id}/rotate
    -
    Rotates an existing API key, invalidating the previous secret key and generating a new one.
    Resets key expiration to 1 year and dispatches notification emails to tenant Owners and Admins.
    """
    return await rotate_tenant_api_key(key_id=key_id, session=db, current_user=current_user)


@router.delete(
    "/{key_id}",
    status_code=status.HTTP_200_OK,
    summary="Revoke/delete a platform API key (Owner & Admin only)",
)
async def revoke_api_key(
    key_id: uuid.UUID,
    current_user: User = Depends(get_current_tenant_owner_or_admin),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """
    DELETE /tenants/current/api-keys/{key_id}
    -
    Permanently revokes and deletes a platform API key for the user's organization.
    Requires Tenant Owner or Admin authorization.
    """
    return await revoke_tenant_api_key(key_id=key_id, session=db, current_user=current_user)
