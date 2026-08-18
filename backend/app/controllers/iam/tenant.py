import asyncio
import math
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import hash_password
from app.models.iam import Tenant, TenantInvitation, User
from app.schemas.iam.tenant import (
    AcceptInvitationSchema,
    TenantCreateSchema,
    TenantInvitationPublicSchema,
    TenantInvitationReadSchema,
    TenantReadSchema,
    PaginatedTenantResponseSchema,
    UserAuditInfoSchema,
)
from app.shared.email import email_service
from app.shared.logger import log


async def create_tenant_and_invite_owner(
    payload: TenantCreateSchema,
    session: AsyncSession,
    current_superuser: User,
) -> dict:
    """
    """
    if not current_superuser.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superuser privileges required to create tenants.",
        )

    clean_email = payload.owner_email.lower().strip()
    clean_username = payload.owner_username.strip().lower()

    user_stmt = select(User).where(
        or_(
            func.lower(User.email) == clean_email,
            func.lower(User.username) == clean_username,
        )
    )
    user_result = await session.execute(user_stmt)
    existing_user = user_result.scalar_one_or_none()

    if existing_user:
        if existing_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Superusers cannot be assigned as tenant owners.",
            )
        if existing_user.tenant_id is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User '{clean_email}' already belongs to an active tenant. A user can only belong to one tenant.",
            )

    inv_stmt = select(TenantInvitation).where(
        func.lower(TenantInvitation.email) == clean_email,
        TenantInvitation.status == "pending",
    )
    pending_invs = (await session.execute(inv_stmt)).scalars().all()
    for old_inv in pending_invs:
        old_inv.status = "revoked"

    new_tenant = Tenant(
        name=payload.name.strip(),
        max_users=payload.max_users,
        storage_quota_gb=payload.storage_quota_gb,
        is_active=True,
        created_by_id=current_superuser.id,
        updated_by_id=current_superuser.id,
    )
    session.add(new_tenant)
    await session.flush()

    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    invitation = TenantInvitation(
        tenant_id=new_tenant.id,
        email=clean_email,
        first_name=payload.owner_first_name.strip(),
        last_name=payload.owner_last_name.strip(),
        token=token,
        role="owner",
        status="pending",
        invited_by_id=current_superuser.id,
        expires_at=expires_at,
    )
    session.add(invitation)
    await session.commit()
    await session.refresh(new_tenant)

    registration_url = f"http://localhost:5173/register?token={token}"

    async def _send_invitation_email():
        try:
            await email_service.send_email(
                to=clean_email,
                subject=f"[{settings.PROJECT_TITLE}] Tenant Owner Registration Invitation",
                template_name="auth/tenant_invitation.html",
                context={
                    "recipient_name": f"{payload.owner_first_name} {payload.owner_last_name}",
                    "tenant_name": new_tenant.name,
                    "registration_url": registration_url,
                    "expires_at": expires_at.strftime("%Y-%m-%d %H:%M:%S UTC"),
                },
            )
            log.info(f"Tenant invitation email dispatched to {clean_email} for tenant '{new_tenant.name}'.")
        except Exception as exc:
            log.error(f"Failed to dispatch tenant invitation email to {clean_email}: {exc}")

    asyncio.create_task(_send_invitation_email())

    return {
        "tenant": TenantReadSchema.model_validate(new_tenant),
        "invitation_token": token,
        "registration_url": registration_url,
        "expires_at": expires_at,
        "message": f"Tenant '{new_tenant.name}' created successfully. Owner invitation dispatched to {clean_email}.",
    }


async def validate_invitation_token(
    token: str,
    session: AsyncSession,
) -> TenantInvitationPublicSchema:
    """
    """
    stmt = (
        select(TenantInvitation)
        .where(TenantInvitation.token == token)
    )
    result = await session.execute(stmt)
    invitation = result.scalar_one_or_none()

    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration token not found.",
        )

    now = datetime.now(timezone.utc)
    is_expired = invitation.expires_at < now
    is_valid = invitation.status == "pending" and not is_expired

    tenant_stmt = select(Tenant).where(Tenant.id == invitation.tenant_id)
    tenant_res = await session.execute(tenant_stmt)
    tenant = tenant_res.scalar_one_or_none()
    tenant_name = tenant.name if tenant else "Organization"

    return TenantInvitationPublicSchema(
        token=token,
        email=invitation.email,
        tenant_name=tenant_name,
        first_name=invitation.first_name,
        last_name=invitation.last_name,
        status=invitation.status if not is_expired else "expired",
        expires_at=invitation.expires_at,
        is_valid=is_valid,
    )


async def accept_tenant_invitation(
    payload: AcceptInvitationSchema,
    session: AsyncSession,
) -> dict:
    """
    """
    stmt = select(TenantInvitation).where(TenantInvitation.token == payload.token)
    result = await session.execute(stmt)
    invitation = result.scalar_one_or_none()

    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registration invitation token not found.",
        )

    now = datetime.now(timezone.utc)
    if invitation.status != "pending" or invitation.expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This registration invitation token has already been used, revoked, or expired.",
        )

    clean_email = invitation.email.lower().strip()

    user_stmt = select(User).where(func.lower(User.email) == clean_email)
    existing_user = (await session.execute(user_stmt)).scalar_one_or_none()

    if existing_user:
        if existing_user.tenant_id is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This user account already belongs to a tenant.",
            )

        existing_user.tenant_id = invitation.tenant_id
        existing_user.role = "owner"
        existing_user.scopes = ["*"]
        if payload.password:
            existing_user.hashed_password = hash_password(payload.password)
        target_user = existing_user
    else:
        suggested_username = (
            payload.username.strip().lower()
            if payload.username
            else clean_email.split("@")[0]
        )
        
        un_stmt = select(User).where(func.lower(User.username) == suggested_username)
        if (await session.execute(un_stmt)).scalar_one_or_none():
            suggested_username = f"{suggested_username}_{secrets.token_hex(2)}"

        target_user = User(
            first_name=payload.first_name.strip() if payload.first_name else (invitation.first_name or "Tenant"),
            last_name=payload.last_name.strip() if payload.last_name else (invitation.last_name or "Owner"),
            username=suggested_username,
            email=clean_email,
            hashed_password=hash_password(payload.password),
            tenant_id=invitation.tenant_id,
            role="owner",
            scopes=["*"],
            is_active=True,
            is_email_verified=True,
            invited_by_id=invitation.invited_by_id,
        )
        session.add(target_user)

    invitation.status = "accepted"
    invitation.accepted_at = now

    await session.commit()
    await session.refresh(target_user)

    log.info(
        f"Tenant owner '{target_user.username}' ({target_user.email}) successfully registered and bound to tenant ID {invitation.tenant_id}."
    )

    return {
        "status": "accepted",
        "message": "Tenant owner registration completed successfully. You can now log in.",
        "user_id": str(target_user.id),
        "email": target_user.email,
        "tenant_id": str(target_user.tenant_id),
    }


async def list_all_tenants(
    session: AsyncSession,
    current_superuser: User,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
    sort_order: str = "desc",
) -> PaginatedTenantResponseSchema:
    """
    Retrieve paginated tenant organizations with name search and creation date sorting (Superuser only).
    """
    if not current_superuser.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superuser privileges required to list tenants.",
        )

    stmt = select(Tenant)
    count_stmt = select(func.count()).select_from(Tenant)

    if search and search.strip():
        clean_search = search.strip().lower()
        search_filter = func.lower(Tenant.name).contains(clean_search)
        stmt = stmt.where(search_filter)
        count_stmt = count_stmt.where(search_filter)

    total_result = await session.execute(count_stmt)
    total = total_result.scalar_one()

    if sort_order.lower() == "asc":
        stmt = stmt.order_by(Tenant.created_at.asc())
    else:
        stmt = stmt.order_by(Tenant.created_at.desc())

    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)

    result = await session.execute(stmt)
    tenants = result.scalars().all()

    tenant_items = []
    for t in tenants:
        item = TenantReadSchema.model_validate(t)
        
        user_stmt = select(User).where(User.tenant_id == t.id, User.role == "owner")
        owner_user = (await session.execute(user_stmt)).scalar_one_or_none()

        if owner_user:
            item.owner_name = f"{owner_user.first_name} {owner_user.last_name}"
            item.owner_email = owner_user.email
            item.owner_status = "accepted"
        else:
            inv_stmt = select(TenantInvitation).where(
                TenantInvitation.tenant_id == t.id
            ).order_by(TenantInvitation.created_at.desc())
            inv = (await session.execute(inv_stmt)).scalars().first()
            if inv:
                if inv.first_name and inv.last_name:
                    item.owner_name = f"{inv.first_name} {inv.last_name}"
                else:
                    item.owner_name = inv.email.split("@")[0]
                item.owner_email = inv.email
                item.owner_status = inv.status

        creator_id = t.created_by_id or current_superuser.id
        creator = (await session.execute(select(User).where(User.id == creator_id))).scalar_one_or_none()
        if creator:
            item.created_by = UserAuditInfoSchema.model_validate(creator)

        updater_id = t.updated_by_id or creator_id
        updater = (await session.execute(select(User).where(User.id == updater_id))).scalar_one_or_none()
        if updater:
            item.updated_by = UserAuditInfoSchema.model_validate(updater)

        tenant_items.append(item)

    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return PaginatedTenantResponseSchema(
        items=tenant_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )
