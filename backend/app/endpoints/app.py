import uuid
from typing import Literal, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_active_user, get_current_tenant_owner_or_admin
from app.database.postgres import get_db_session
from app.models.iam import User
from app.schemas.iam.app import (
    AppAssignUsersSchema,
    AppCreateSchema,
    AppReadSchema,
    AppUpdateSchema,
    PaginatedAppResponseSchema,
)
from app.controllers.iam.app import (
    assign_users_to_app,
    create_tenant_app,
    delete_tenant_app,
    list_tenant_apps,
    update_tenant_app,
)

router = APIRouter(prefix="/tenants/current/apps", tags=["Tenant Applications Management"])


@router.post(
    "",
    response_model=AppReadSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new monitored application (Owner & Admin only)",
)
async def create_app(
    payload: AppCreateSchema,
    current_user: User = Depends(get_current_tenant_owner_or_admin),
    db: AsyncSession = Depends(get_db_session),
) -> AppReadSchema:
    """
    POST /tenants/current/apps
    -
    Registers a new monitored client application under the current tenant.
    Requires Tenant Owner or Admin authorization.
    """
    return await create_tenant_app(payload=payload, session=db, current_user=current_user)


@router.get(
    "",
    response_model=PaginatedAppResponseSchema,
    status_code=status.HTTP_200_OK,
    summary="List paginated applications for the current tenant",
)
async def get_apps(
    search: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    sort_order: Literal["asc", "desc"] = Query(default="desc"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session),
) -> PaginatedAppResponseSchema:
    """
    GET /tenants/current/apps
    -
    Returns a paginated list of applications registered under the current tenant.
    - Tenant Owners and Admins can see all tenant apps.
    - Tenant Analysts/members only see apps explicitly assigned to them.
    """
    return await list_tenant_apps(
        session=db,
        current_user=current_user,
        search=search,
        page=page,
        page_size=page_size,
        sort_order=sort_order,
    )


@router.patch(
    "/{app_id}",
    response_model=AppReadSchema,
    status_code=status.HTTP_200_OK,
    summary="Update the name of an application (Owner & Admin only)",
)
async def update_app(
    app_id: uuid.UUID,
    payload: AppUpdateSchema,
    current_user: User = Depends(get_current_tenant_owner_or_admin),
    db: AsyncSession = Depends(get_db_session),
) -> AppReadSchema:
    """
    PATCH /tenants/current/apps/{app_id}
    -
    Updates the name of a registered application.
    Requires Tenant Owner or Admin authorization.
    """
    return await update_tenant_app(app_uuid=app_id, payload=payload, session=db, current_user=current_user)


@router.delete(
    "/{app_id}",
    status_code=status.HTTP_200_OK,
    summary="Permanently delete/revoke an application (Owner & Admin only)",
)
async def delete_app(
    app_id: uuid.UUID,
    current_user: User = Depends(get_current_tenant_owner_or_admin),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """
    DELETE /tenants/current/apps/{app_id}
    -
    Permanently deletes a registered application and all associated user assignments.
    Requires Tenant Owner or Admin authorization.
    """
    return await delete_tenant_app(app_uuid=app_id, session=db, current_user=current_user)


@router.put(
    "/{app_id}/users",
    response_model=AppReadSchema,
    status_code=status.HTTP_200_OK,
    summary="Assign user members to an application (Owner & Admin only)",
)
async def assign_users(
    app_id: uuid.UUID,
    payload: AppAssignUsersSchema,
    current_user: User = Depends(get_current_tenant_owner_or_admin),
    db: AsyncSession = Depends(get_db_session),
) -> AppReadSchema:
    """
    PUT /tenants/current/apps/{app_id}/users
    -
    Updates the list of user members assigned to a specific application.
    Requires Tenant Owner or Admin authorization.
    """
    return await assign_users_to_app(app_uuid=app_id, payload=payload, session=db, current_user=current_user)
