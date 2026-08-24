import math
import uuid
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.iam import TenantApp, User
from app.schemas.iam.app import (
    AppAssignUsersSchema,
    AppCreateSchema,
    AppReadSchema,
    AppUpdateSchema,
    PaginatedAppResponseSchema,
)


async def create_tenant_app(
    payload: AppCreateSchema,
    session: AsyncSession,
    current_user: User,
) -> AppReadSchema:
    """
    """
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have an assigned organization context.",
        )

    app_id_clean = payload.app_id.strip()
    exist_stmt = select(TenantApp).where(TenantApp.app_id == app_id_clean)
    existing_app = (await session.execute(exist_stmt)).scalar_one_or_none()
    if existing_app:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Application ID '{app_id_clean}' is already in use.",
        )

    new_app = TenantApp(
        tenant_id=tenant_id,
        name=payload.name.strip(),
        app_id=app_id_clean,
        is_active=True,
    )
    session.add(new_app)

    user_ids_to_assign = []
    if payload.user_ids:
        user_stmt = select(User).where(User.id.in_(payload.user_ids), User.tenant_id == tenant_id)
        users = (await session.execute(user_stmt)).scalars().all()
        if len(users) != len(payload.user_ids):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="One or more assigned users do not exist or do not belong to your organization.",)
        new_app.users = list(users)
        user_ids_to_assign = [u.id for u in users]

    await session.commit()
    await session.refresh(new_app)

    return AppReadSchema(
        id=new_app.id,
        tenant_id=new_app.tenant_id,
        name=new_app.name,
        app_id=new_app.app_id,
        is_active=new_app.is_active,
        created_at=new_app.created_at,
        updated_at=new_app.updated_at,
        user_ids=user_ids_to_assign,
    )


async def update_tenant_app(
    app_uuid: uuid.UUID,
    payload: AppUpdateSchema,
    session: AsyncSession,
    current_user: User,
) -> AppReadSchema:
    """
    Updates the name of an existing application.
    Requires Tenant Owner or Admin authorization.
    """
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User does not have an assigned organization context.",)

    stmt = select(TenantApp).where(TenantApp.id == app_uuid, TenantApp.tenant_id == tenant_id).options(selectinload(TenantApp.users))
    app_obj = (await session.execute(stmt)).scalar_one_or_none()
    if not app_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found or access denied.",
        )

    app_obj.name = payload.name.strip()
    await session.commit()
    await session.refresh(app_obj)

    return AppReadSchema(
        id=app_obj.id,
        tenant_id=app_obj.tenant_id,
        name=app_obj.name,
        app_id=app_obj.app_id,
        is_active=app_obj.is_active,
        created_at=app_obj.created_at,
        updated_at=app_obj.updated_at,
        user_ids=[u.id for u in app_obj.users],
    )


async def delete_tenant_app(
    app_uuid: uuid.UUID,
    session: AsyncSession,
    current_user: User,
) -> dict:
    """
    Permanently deletes a registered application.
    Requires Tenant Owner or Admin authorization.
    """
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User does not have an assigned organization context.")

    stmt = select(TenantApp).where(TenantApp.id == app_uuid, TenantApp.tenant_id == tenant_id)
    app_obj = (await session.execute(stmt)).scalar_one_or_none()
    if not app_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found or access denied.",
        )

    await session.delete(app_obj)
    await session.commit()

    return {
        "status": "deleted",
        "message": f"Application '{app_obj.name}' was successfully deleted.",
    }


async def list_tenant_apps(
    session: AsyncSession,
    current_user: User,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
    sort_order: str = "desc",
) -> PaginatedAppResponseSchema:
    """
    List registered applications in the user's organization.
    - Owners and Admins can see all apps of the tenant.
    - Other roles (like Analyst) can ONLY see apps explicitly assigned to them.
    Supports filtering by name or app_id, pagination, and sorting by created_at.
    """
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User does not have an assigned organization context.")

    user_role = (current_user.role or "").lower().strip()
    is_privileged = user_role in ("owner", "admin") or current_user.is_superuser

    stmt = select(TenantApp).where(TenantApp.tenant_id == tenant_id)
    count_stmt = select(func.count()).select_from(TenantApp).where(TenantApp.tenant_id == tenant_id)

    if not is_privileged:
        stmt = stmt.join(TenantApp.users).where(User.id == current_user.id)
        count_stmt = count_stmt.join(TenantApp.users).where(User.id == current_user.id)

    if search and search.strip():
        clean_search = search.strip().lower()
        search_filter = or_(
            func.lower(TenantApp.name).contains(clean_search),
            func.lower(TenantApp.app_id).contains(clean_search),
        )
        stmt = stmt.where(search_filter)
        count_stmt = count_stmt.where(search_filter)

    if sort_order.lower() == "asc":
        stmt = stmt.order_by(TenantApp.created_at.asc())
    else:
        stmt = stmt.order_by(TenantApp.created_at.desc())

    total_result = await session.execute(count_stmt)
    total = total_result.scalar_one()

    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size).options(selectinload(TenantApp.users))

    result = await session.execute(stmt)
    apps = result.scalars().all()

    app_items = []
    for app in apps:
        app_items.append(
            AppReadSchema(
                id=app.id,
                tenant_id=app.tenant_id,
                name=app.name,
                app_id=app.app_id,
                is_active=app.is_active,
                created_at=app.created_at,
                updated_at=app.updated_at,
                user_ids=[u.id for u in app.users],
            )
        )

    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return PaginatedAppResponseSchema(
        items=app_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


async def assign_users_to_app(
    app_uuid: uuid.UUID,
    payload: AppAssignUsersSchema,
    session: AsyncSession,
    current_user: User,
) -> AppReadSchema:
    """
    Updates the list of users assigned to a specific application.
    Requires Tenant Owner or Admin authorization.
    """
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have an assigned organization context.",
        )

    stmt = select(TenantApp).where(TenantApp.id == app_uuid, TenantApp.tenant_id == tenant_id).options(selectinload(TenantApp.users))
    app_obj = (await session.execute(stmt)).scalar_one_or_none()
    if not app_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found or access denied.",
        )

    if payload.user_ids:
        user_stmt = select(User).where(User.id.in_(payload.user_ids), User.tenant_id == tenant_id)
        users = (await session.execute(user_stmt)).scalars().all()
        if len(users) != len(payload.user_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more assigned users do not exist or do not belong to your organization.",
            )
        app_obj.users = list(users)
    else:
        app_obj.users = []

    await session.commit()
    await session.refresh(app_obj)

    return AppReadSchema(
        id=app_obj.id,
        tenant_id=app_obj.tenant_id,
        name=app_obj.name,
        app_id=app_obj.app_id,
        is_active=app_obj.is_active,
        created_at=app_obj.created_at,
        updated_at=app_obj.updated_at,
        user_ids=[u.id for u in app_obj.users],
    )
