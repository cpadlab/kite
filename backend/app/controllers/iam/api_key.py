import asyncio
import hashlib
import math
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Literal, Optional

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.iam import Tenant, TenantApiKey, User
from app.schemas.iam.api_key import (
    ApiKeyCreateSchema,
    ApiKeyCreatedResponseSchema,
    ApiKeyReadSchema,
    PaginatedApiKeyResponseSchema,
)
from app.schemas.iam.tenant import UserAuditInfoSchema
from app.shared.email import email_service
from app.shared.logger import log

async def _notify_tenant_admins_and_owners(
    tenant_id: uuid.UUID,
    session: AsyncSession,
    subject: str,
    template_name: str,
    context_builder: callable,
):
    """
    """
    stmt = select(User).where(
        User.tenant_id == tenant_id,
        or_(func.lower(User.role) == "owner", func.lower(User.role) == "admin"),
        User.is_active == True,
    )
    result = await session.execute(stmt)
    admins_and_owners = result.scalars().all()

    tenant_stmt = select(Tenant).where(Tenant.id == tenant_id)
    tenant_res = await session.execute(tenant_stmt)
    tenant = tenant_res.scalar_one_or_none()
    tenant_name = tenant.name if tenant else "Organization"

    for recipient in admins_and_owners:
        try:
            recipient_name = f"{recipient.first_name} {recipient.last_name}".strip()
            ctx = context_builder(recipient_name, tenant_name)
            await email_service.send_html_email(
                to_email=recipient.email,
                subject=subject,
                template_name=template_name,
                context=ctx,
            )
            log.info(f"API key notification email '{template_name}' sent to {recipient.email}.")
        except Exception as exc:
            log.error(f"Failed to dispatch API key notification to {recipient.email}: {exc}")


async def create_tenant_api_key(
    payload: ApiKeyCreateSchema,
    session: AsyncSession,
    current_user: User,
) -> ApiKeyCreatedResponseSchema:
    """
    """
    tenant_id = current_user.tenant_id

    raw_secret = secrets.token_hex(20)
    secret_key = f"kite_ak_{raw_secret}"
    key_prefix = secret_key[:12]
    hashed_key = hashlib.sha256(secret_key.encode("utf-8")).hexdigest()

    expiration_days = min(365, max(1, payload.expiration_days))
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=expiration_days)

    api_key_record = TenantApiKey(
        tenant_id=tenant_id,
        name=payload.name.strip(),
        key_prefix=key_prefix,
        hashed_key=hashed_key,
        scopes=payload.scopes,
        is_active=True,
        expires_at=expires_at,
        created_by_id=current_user.id,
    )
    session.add(api_key_record)
    await session.commit()
    await session.refresh(api_key_record)

    key_schema = ApiKeyReadSchema.model_validate(api_key_record)
    key_schema.created_by = UserAuditInfoSchema.model_validate(current_user)

    creator_name = f"{current_user.first_name} {current_user.last_name}".strip()
    creator_email = current_user.email
    scopes_formatted = ", ".join(payload.scopes) if payload.scopes else "Full Access (*)"
    exp_formatted = expires_at.strftime("%Y-%m-%d %H:%M UTC")

    async def _dispatch_creation_emails():
        await _notify_tenant_admins_and_owners(
            tenant_id=tenant_id,
            session=session,
            subject=f"[{settings.PROJECT_TITLE}] New Platform API Key Created - {payload.name}",
            template_name="auth/api_key_created.html",
            context_builder=lambda recipient_name, tenant_name: {
                "project_title": settings.PROJECT_TITLE,
                "recipient_name": recipient_name,
                "tenant_name": tenant_name,
                "creator_name": creator_name,
                "creator_email": creator_email,
                "key_name": payload.name,
                "key_prefix": key_prefix,
                "expires_at": exp_formatted,
                "scopes": scopes_formatted,
            },
        )

    asyncio.create_task(_dispatch_creation_emails())

    return ApiKeyCreatedResponseSchema(
        api_key=key_schema,
        secret_key=secret_key,
        message="Platform API Key generated successfully. Copy the secret key now as it will not be shown again.",
    )


async def list_tenant_api_keys(
    session: AsyncSession,
    current_user: User,
    page: int = 1,
    page_size: int = 10,
    search: Optional[str] = None,
    sort_order: Literal["asc", "desc"] = "desc",
) -> PaginatedApiKeyResponseSchema:
    """
    """
    tenant_id = current_user.tenant_id

    base_query = select(TenantApiKey).where(TenantApiKey.tenant_id == tenant_id)

    if search:
        search_term = f"%{search.strip()}%"
        base_query = base_query.where(
            or_(
                TenantApiKey.name.ilike(search_term),
                TenantApiKey.key_prefix.ilike(search_term),
            )
        )

    count_stmt = select(func.count()).select_from(base_query.subquery())
    total = (await session.execute(count_stmt)).scalar() or 0

    order_clause = (
        TenantApiKey.created_at.asc()
        if sort_order == "asc"
        else TenantApiKey.created_at.desc()
    )

    offset = (page - 1) * page_size
    stmt = base_query.order_by(order_clause).offset(offset).limit(page_size)
    result = await session.execute(stmt)
    keys = result.scalars().all()

    items = []
    for k in keys:
        item = ApiKeyReadSchema.model_validate(k)
        if k.created_by_id:
            creator_stmt = select(User).where(User.id == k.created_by_id)
            creator = (await session.execute(creator_stmt)).scalar_one_or_none()
            if creator:
                item.created_by = UserAuditInfoSchema.model_validate(creator)
        items.append(item)

    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return PaginatedApiKeyResponseSchema(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


async def rotate_tenant_api_key(
    key_id: uuid.UUID,
    session: AsyncSession,
    current_user: User,
) -> ApiKeyCreatedResponseSchema:
    """
    """
    tenant_id = current_user.tenant_id

    stmt = select(TenantApiKey).where(
        TenantApiKey.id == key_id,
        TenantApiKey.tenant_id == tenant_id,
    )
    key_record = (await session.execute(stmt)).scalar_one_or_none()

    if not key_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Platform API Key not found or does not belong to your organization.",
        )

    raw_secret = secrets.token_hex(20)
    new_secret_key = f"kite_ak_{raw_secret}"
    new_key_prefix = new_secret_key[:12]
    new_hashed_key = hashlib.sha256(new_secret_key.encode("utf-8")).hexdigest()

    now = datetime.now(timezone.utc)
    new_expires_at = now + timedelta(days=365)

    key_record.key_prefix = new_key_prefix
    key_record.hashed_key = new_hashed_key
    key_record.expires_at = new_expires_at
    key_record.updated_at = now
    key_record.reminder_30d_sent = False
    key_record.reminder_24h_sent = False

    await session.commit()
    await session.refresh(key_record)

    key_schema = ApiKeyReadSchema.model_validate(key_record)
    if key_record.created_by_id:
        creator_stmt = select(User).where(User.id == key_record.created_by_id)
        creator = (await session.execute(creator_stmt)).scalar_one_or_none()
        if creator:
            key_schema.created_by = UserAuditInfoSchema.model_validate(creator)

    rotator_name = f"{current_user.first_name} {current_user.last_name}".strip()
    rotator_email = current_user.email
    exp_formatted = new_expires_at.strftime("%Y-%m-%d %H:%M UTC")

    async def _dispatch_rotation_emails():
        await _notify_tenant_admins_and_owners(
            tenant_id=tenant_id,
            session=session,
            subject=f"[{settings.PROJECT_TITLE}] Platform API Key Rotated - {key_record.name}",
            template_name="auth/api_key_rotated.html",
            context_builder=lambda recipient_name, tenant_name: {
                "project_title": settings.PROJECT_TITLE,
                "recipient_name": recipient_name,
                "tenant_name": tenant_name,
                "rotator_name": rotator_name,
                "rotator_email": rotator_email,
                "key_name": key_record.name,
                "key_prefix": new_key_prefix,
                "expires_at": exp_formatted,
            },
        )

    asyncio.create_task(_dispatch_rotation_emails())

    return ApiKeyCreatedResponseSchema(
        api_key=key_schema,
        secret_key=new_secret_key,
        message="Platform API Key rotated successfully. The previous key has been invalidated.",
    )


async def revoke_tenant_api_key(
    key_id: uuid.UUID,
    session: AsyncSession,
    current_user: User,
) -> dict:
    """
    """
    tenant_id = current_user.tenant_id

    stmt = select(TenantApiKey).where(
        TenantApiKey.id == key_id,
        TenantApiKey.tenant_id == tenant_id,
    )
    key_record = (await session.execute(stmt)).scalar_one_or_none()

    if not key_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Platform API Key not found or does not belong to your organization.",
        )

    await session.delete(key_record)
    await session.commit()

    log.info(f"API key '{key_record.name}' ({key_record.key_prefix}) revoked by {current_user.email}.")

    return {
        "status": "revoked",
        "message": f"Platform API Key '{key_record.name}' has been permanently revoked.",
    }


async def check_api_key_expiration_reminders(session: AsyncSession):
    """
    """
    now = datetime.now(timezone.utc)
    in_30_days = now + timedelta(days=30)
    in_24_hours = now + timedelta(hours=24)

    stmt_30d = select(TenantApiKey).where(
        TenantApiKey.is_active == True,
        TenantApiKey.reminder_30d_sent == False,
        TenantApiKey.expires_at <= in_30_days,
        TenantApiKey.expires_at > in_24_hours,
    )
    keys_30d = (await session.execute(stmt_30d)).scalars().all()

    for k in keys_30d:
        exp_formatted = k.expires_at.strftime("%Y-%m-%d %H:%M UTC")
        await _notify_tenant_admins_and_owners(
            tenant_id=k.tenant_id,
            session=session,
            subject=f"[{settings.PROJECT_TITLE}] Warning: API Key '{k.name}' expires in 30 days",
            template_name="auth/api_key_expiring.html",
            context_builder=lambda recipient_name, tenant_name: {
                "project_title": settings.PROJECT_TITLE,
                "recipient_name": recipient_name,
                "tenant_name": tenant_name,
                "key_name": k.name,
                "key_prefix": k.key_prefix,
                "timeframe": "30 days (1 month)",
                "expires_at": exp_formatted,
            },
        )
        k.reminder_30d_sent = True

    stmt_24h = select(TenantApiKey).where(
        TenantApiKey.is_active == True,
        TenantApiKey.reminder_24h_sent == False,
        TenantApiKey.expires_at <= in_24_hours,
        TenantApiKey.expires_at > now,
    )
    keys_24h = (await session.execute(stmt_24h)).scalars().all()

    for k in keys_24h:
        exp_formatted = k.expires_at.strftime("%Y-%m-%d %H:%M UTC")
        await _notify_tenant_admins_and_owners(
            tenant_id=k.tenant_id,
            session=session,
            subject=f"[{settings.PROJECT_TITLE}] CRITICAL: API Key '{k.name}' expires in 24 hours",
            template_name="auth/api_key_expiring.html",
            context_builder=lambda recipient_name, tenant_name: {
                "project_title": settings.PROJECT_TITLE,
                "recipient_name": recipient_name,
                "tenant_name": tenant_name,
                "key_name": k.name,
                "key_prefix": k.key_prefix,
                "timeframe": "24 hours",
                "expires_at": exp_formatted,
            },
        )
        k.reminder_24h_sent = True

    if keys_30d or keys_24h:
        await session.commit()
