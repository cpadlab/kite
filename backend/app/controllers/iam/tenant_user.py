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
from app.controllers.iam.totp import verify_totp_code
from app.models.iam import Tenant, TenantInvitation, User, UserSession
from app.schemas.iam.tenant_user import (
    PaginatedTenantInvitationResponseSchema,
    PaginatedTenantMemberResponseSchema,
    TenantInvitationDetailSchema,
    TenantMemberReadSchema,
    TenantOwnershipTransferSchema,
    TenantUserInviteResponseSchema,
    TenantUserInviteSchema,
    TenantUserRemoveSchema,
    TenantUserRoleUpdateSchema,
    TenantUserScopesUpdateSchema,
    TenantUserStatusToggleSchema,
)
from app.shared.email import email_service
from app.shared.logger import log


def _verify_actor_totp_if_enabled(current_user: User, totp_code: Optional[str]) -> None:
    """
    Enforce 2FA TOTP verification if 2FA is active on the requesting account.
    """
    if current_user.is_2fa_enabled:
        if not totp_code or not totp_code.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="2FA TOTP verification code is required to perform this administrative action.",
            )
        is_valid = verify_totp_code(
            secret=current_user.totp_secret or "",
            code=totp_code.strip(),
            backup_codes=current_user.backup_codes or [],
        )
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid 2FA TOTP code. Operation rejected.",
            )


async def invite_tenant_user(
    payload: TenantUserInviteSchema,
    session: AsyncSession,
    current_user: User,
) -> TenantUserInviteResponseSchema:
    """
    Dispatch an invitation email to a new user for the current tenant.
    Only Tenant Owners and Administrators can invite new members.
    """
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must belong to an organization to invite team members.",
        )

    user_role = (current_user.role or "").lower().strip()
    if user_role not in ("owner", "admin") and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Organization Owners and Administrators can invite users.",
        )

    target_role = payload.role.lower().strip()
    if target_role not in ("admin", "analyst"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid invitation role. Must be 'admin' or 'analyst'. Ownership cannot be assigned via invitation.",
        )

    tenant_stmt = select(Tenant).where(Tenant.id == current_user.tenant_id)
    tenant_res = await session.execute(tenant_stmt)
    tenant = tenant_res.scalar_one_or_none()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found.",
        )

    users_count_stmt = select(func.count()).select_from(User).where(User.tenant_id == tenant.id)
    active_users_count = (await session.execute(users_count_stmt)).scalar_one()

    invs_count_stmt = select(func.count()).select_from(TenantInvitation).where(
        TenantInvitation.tenant_id == tenant.id,
        TenantInvitation.status == "pending",
    )
    pending_invs_count = (await session.execute(invs_count_stmt)).scalar_one()

    if (active_users_count + pending_invs_count) >= tenant.max_users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Organization member limit reached ({tenant.max_users} max users allowed). Upgrade your plan to invite more members.",
        )

    clean_email = payload.email.lower().strip()
    clean_username = payload.username.lower().strip()

    existing_user_stmt = select(User).where(
        or_(
            func.lower(User.email) == clean_email,
            func.lower(User.username) == clean_username,
        )
    )
    existing_user = (await session.execute(existing_user_stmt)).scalar_one_or_none()
    if existing_user:
        if existing_user.tenant_id is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User '{clean_email}' already belongs to an active organization.",
            )

    old_invs_stmt = select(TenantInvitation).where(
        TenantInvitation.tenant_id == tenant.id,
        or_(
            func.lower(TenantInvitation.email) == clean_email,
            func.lower(TenantInvitation.username) == clean_username,
        ),
        TenantInvitation.status == "pending",
    )
    old_invs = (await session.execute(old_invs_stmt)).scalars().all()
    for inv in old_invs:
        inv.status = "revoked"

    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    invitation = TenantInvitation(
        tenant_id=tenant.id,
        email=clean_email,
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        username=clean_username,
        token=token,
        role=target_role,
        scopes=payload.scopes,
        status="pending",
        invited_by_id=current_user.id,
        expires_at=expires_at,
    )
    session.add(invitation)
    await session.commit()
    await session.refresh(invitation)

    invitation_url = f"{settings.FRONTEND_URL}/register?token={token}"
    inviter_name = f"{current_user.first_name} {current_user.last_name}".strip() or current_user.username
    role_title = "Administrator" if target_role == "admin" else "Analyst"

    async def _send_user_invitation_email():
        try:
            await email_service.send_html_email(
                to_email=clean_email,
                subject=f"Invitation to join {tenant.name} on {settings.PROJECT_TITLE}",
                template_name="auth/tenant_user_invitation.html",
                context={
                    "project_title": settings.PROJECT_TITLE,
                    "recipient_name": f"{payload.first_name} {payload.last_name}".strip(),
                    "inviter_name": inviter_name,
                    "tenant_name": tenant.name,
                    "role_title": role_title,
                    "username": clean_username,
                    "scopes_list": ", ".join(payload.scopes) if payload.scopes else "Standard Access",
                    "registration_url": invitation_url,
                    "expires_at": expires_at.strftime("%Y-%m-%d %H:%M:%S UTC"),
                },
            )
            log.info(f"Tenant user invitation email sent to {clean_email} for tenant '{tenant.name}'.")
        except Exception as exc:
            log.error(f"Failed to send tenant user invitation email to {clean_email}: {exc}")

    asyncio.create_task(_send_user_invitation_email())

    return TenantUserInviteResponseSchema(
        id=invitation.id,
        tenant_id=tenant.id,
        email=clean_email,
        first_name=invitation.first_name,
        last_name=invitation.last_name,
        username=invitation.username,
        role=target_role,
        scopes=invitation.scopes,
        status=invitation.status,
        expires_at=invitation.expires_at,
        invitation_url=invitation_url,
        message=f"Invitation sent successfully to {clean_email}.",
    )


async def list_tenant_invitations(
    session: AsyncSession,
    current_user: User,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
    sort_order: str = "desc",
) -> PaginatedTenantInvitationResponseSchema:
    """
    Retrieve paginated invitations dispatched by the current tenant organization.
    """
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization context required to view invitations.",
        )

    now = datetime.now(timezone.utc)
    pending_stmt = select(TenantInvitation).where(
        TenantInvitation.tenant_id == current_user.tenant_id,
        TenantInvitation.status == "pending",
    )
    pending_invs = (await session.execute(pending_stmt)).scalars().all()
    status_changed = False
    for inv in pending_invs:
        usr_stmt = select(User).where(
            User.tenant_id == current_user.tenant_id,
            or_(
                func.lower(User.email) == func.lower(inv.email),
                func.lower(User.username) == func.lower(inv.username),
            ),
        )
        existing_m = (await session.execute(usr_stmt)).scalar_one_or_none()
        if existing_m:
            inv.status = "accepted"
            inv.accepted_at = now
            status_changed = True
        elif inv.expires_at and inv.expires_at < now:
            inv.status = "expired"
            status_changed = True

    if status_changed:
        await session.commit()

    stmt = select(TenantInvitation).where(TenantInvitation.tenant_id == current_user.tenant_id)
    count_stmt = select(func.count()).select_from(TenantInvitation).where(
        TenantInvitation.tenant_id == current_user.tenant_id
    )

    if search and search.strip():
        clean_search = f"%{search.strip().lower()}%"
        search_filter = or_(
            func.lower(TenantInvitation.email).like(clean_search),
            func.lower(TenantInvitation.username).like(clean_search),
            func.lower(TenantInvitation.first_name).like(clean_search),
            func.lower(TenantInvitation.last_name).like(clean_search),
        )
        stmt = stmt.where(search_filter)
        count_stmt = count_stmt.where(search_filter)

    total_result = await session.execute(count_stmt)
    total = total_result.scalar_one()

    if sort_order.lower() == "asc":
        stmt = stmt.order_by(TenantInvitation.created_at.asc())
    else:
        stmt = stmt.order_by(TenantInvitation.created_at.desc())

    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)

    invs_result = await session.execute(stmt)
    invitations = invs_result.scalars().all()

    items = []
    for inv in invitations:
        invited_by = (await session.execute(select(User).where(User.id == inv.invited_by_id))).scalar_one_or_none()
        inv_item = TenantInvitationDetailSchema(
            id=inv.id,
            tenant_id=inv.tenant_id,
            email=inv.email,
            first_name=inv.first_name,
            last_name=inv.last_name,
            username=inv.username,
            role=inv.role,
            scopes=inv.scopes or [],
            status=inv.status,
            expires_at=inv.expires_at,
            created_at=inv.created_at,
            invited_by_name=f"{invited_by.first_name} {invited_by.last_name}".strip() if invited_by else None,
            invited_by_email=invited_by.email if invited_by else None,
        )
        items.append(inv_item)

    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return PaginatedTenantInvitationResponseSchema(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


async def revoke_tenant_invitation(
    invitation_id: uuid.UUID,
    session: AsyncSession,
    current_user: User,
) -> dict:
    """
    Revoke a pending tenant invitation.
    """
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization context required.",
        )

    stmt = select(TenantInvitation).where(
        TenantInvitation.id == invitation_id,
        TenantInvitation.tenant_id == current_user.tenant_id,
    )
    invitation = (await session.execute(stmt)).scalar_one_or_none()
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation token not found.",
        )

    if invitation.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot revoke an invitation with status '{invitation.status}'.",
        )

    invitation.status = "revoked"
    await session.commit()

    return {"status": "success", "message": "Invitation revoked successfully."}


async def list_tenant_members(
    session: AsyncSession,
    current_user: User,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
    sort_order: str = "desc",
) -> PaginatedTenantMemberResponseSchema:
    """
    List all active user members belonging to the current tenant organization.
    Accessible to ALL authenticated members of the tenant (directory view).
    """
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization context required to view team members.",
        )

    stmt = select(User).where(User.tenant_id == current_user.tenant_id)
    count_stmt = select(func.count()).select_from(User).where(User.tenant_id == current_user.tenant_id)

    if search and search.strip():
        clean_search = f"%{search.strip().lower()}%"
        search_filter = or_(
            func.lower(User.email).like(clean_search),
            func.lower(User.username).like(clean_search),
            func.lower(User.first_name).like(clean_search),
            func.lower(User.last_name).like(clean_search),
        )
        stmt = stmt.where(search_filter)
        count_stmt = count_stmt.where(search_filter)

    total_result = await session.execute(count_stmt)
    total = total_result.scalar_one()

    if sort_order.lower() == "asc":
        stmt = stmt.order_by(User.created_at.asc())
    else:
        stmt = stmt.order_by(User.created_at.desc())

    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)

    users_result = await session.execute(stmt)
    members = users_result.scalars().all()

    user_role = (current_user.role or "").lower().strip()
    is_privileged = user_role in ("owner", "admin") or current_user.is_superuser

    items = []
    for m in members:
        if is_privileged:
            items.append(TenantMemberReadSchema.model_validate(m))
        else:
            items.append(
                TenantMemberReadSchema(
                    id=m.id,
                    tenant_id=m.tenant_id,
                    email=m.email,
                    first_name=m.first_name,
                    last_name=m.last_name,
                    username=m.username,
                    role=m.role,
                    scopes=[],
                    is_active=m.is_active,
                    is_2fa_enabled=False,
                    created_at=m.created_at,
                    last_login_at=None,
                )
            )
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return PaginatedTenantMemberResponseSchema(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


async def update_tenant_user_role(
    target_user_id: uuid.UUID,
    payload: TenantUserRoleUpdateSchema,
    session: AsyncSession,
    current_user: User,
) -> TenantMemberReadSchema:
    """
    Update the role of a tenant team member (admin or analyst).
    Dispatches an email notification to the affected user.
    """
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization context required.",
        )

    stmt = select(User).where(
        User.id == target_user_id,
        User.tenant_id == current_user.tenant_id,
    )
    target_user = (await session.execute(stmt)).scalar_one_or_none()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization team member not found.",
        )

    previous_role = (target_user.role or "").lower().strip()
    if previous_role == "owner":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change the role of the tenant owner directly. Use ownership transfer instead.",
        )

    current_role = (current_user.role or "").lower().strip()
    if current_role == "admin" and previous_role in ("admin", "owner"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrators cannot modify the role of other Administrators or the Owner.",
        )

    new_role = payload.role.lower().strip()
    if previous_role != new_role:
        target_user.role = new_role
        await session.commit()
        await session.refresh(target_user)

        tenant_stmt = select(Tenant).where(Tenant.id == current_user.tenant_id)
        tenant = (await session.execute(tenant_stmt)).scalar_one_or_none()
        tenant_name = tenant.name if tenant else "Organization"
        updated_by_name = f"{current_user.first_name} {current_user.last_name}".strip() or current_user.username
        new_role_title = "Administrator" if new_role == "admin" else "Analyst"

        async def _send_role_update_email():
            try:
                update_date = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
                await email_service.send_html_email(
                    to_email=target_user.email,
                    subject=f"[{settings.PROJECT_TITLE}] Security Alert: Your Organization Role Has Been Updated",
                    template_name="auth/role_updated.html",
                    context={
                        "project_title": settings.PROJECT_TITLE,
                        "recipient_name": f"{target_user.first_name} {target_user.last_name}".strip(),
                        "tenant_name": tenant_name,
                        "new_role_title": new_role_title,
                        "updated_by_name": updated_by_name,
                        "update_date": update_date,
                    },
                )
                log.info(f"Role update notification email sent to '{target_user.email}'.")
            except Exception as exc:
                log.error(f"Failed to send role update notification email to '{target_user.email}': {exc}")

        asyncio.create_task(_send_role_update_email())

    return TenantMemberReadSchema.model_validate(target_user)


async def update_tenant_user_scopes(
    target_user_id: uuid.UUID,
    payload: TenantUserScopesUpdateSchema,
    session: AsyncSession,
    current_user: User,
) -> TenantMemberReadSchema:
    """
    Update assigned scopes for a tenant team member.
    Dispatches an email notification ONLY IF new scopes were added to the user.
    """
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization context required.",
        )

    stmt = select(User).where(
        User.id == target_user_id,
        User.tenant_id == current_user.tenant_id,
    )
    target_user = (await session.execute(stmt)).scalar_one_or_none()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization team member not found.",
        )

    if (target_user.role or "").lower() == "owner":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant owner has full access (*) and scopes cannot be restricted.",
        )

    current_role = (current_user.role or "").lower().strip()
    if current_role == "admin" and (target_user.role or "").lower() == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrators cannot modify the scopes of other Administrators.",
        )

    previous_scopes = set(target_user.scopes or [])
    new_scopes = set(payload.scopes or [])
    added_scopes = new_scopes - previous_scopes

    target_user.scopes = payload.scopes
    await session.commit()
    await session.refresh(target_user)

    if len(added_scopes) > 0:
        tenant_stmt = select(Tenant).where(Tenant.id == current_user.tenant_id)
        tenant = (await session.execute(tenant_stmt)).scalar_one_or_none()
        tenant_name = tenant.name if tenant else "Organization"
        updated_by_name = f"{current_user.first_name} {current_user.last_name}".strip() or current_user.username

        async def _send_scopes_update_email():
            try:
                update_date = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
                await email_service.send_html_email(
                    to_email=target_user.email,
                    subject=f"[{settings.PROJECT_TITLE}] Security Alert: System Permissions Updated",
                    template_name="auth/scopes_updated.html",
                    context={
                        "project_title": settings.PROJECT_TITLE,
                        "recipient_name": f"{target_user.first_name} {target_user.last_name}".strip(),
                        "tenant_name": tenant_name,
                        "added_scopes": ", ".join(sorted(list(added_scopes))),
                        "total_scopes": ", ".join(sorted(list(new_scopes))) if new_scopes else "None",
                        "updated_by_name": updated_by_name,
                        "update_date": update_date,
                    },
                )
                log.info(f"Scopes update notification email sent to '{target_user.email}'.")
            except Exception as exc:
                log.error(f"Failed to send scopes update notification email to '{target_user.email}': {exc}")

        asyncio.create_task(_send_scopes_update_email())

    return TenantMemberReadSchema.model_validate(target_user)


async def toggle_tenant_user_status(
    target_user_id: uuid.UUID,
    payload: TenantUserStatusToggleSchema,
    session: AsyncSession,
    current_user: User,
) -> TenantMemberReadSchema:
    """
    Disable or enable a tenant team member account.
    Requires 2FA TOTP verification if 2FA is active on the requesting account.
    Disabled users cannot log in.
    """
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization context required.",
        )

    if current_user.id == target_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot disable your own account.",
        )

    _verify_actor_totp_if_enabled(current_user, payload.totp_code)

    stmt = select(User).where(
        User.id == target_user_id,
        User.tenant_id == current_user.tenant_id,
    )
    target_user = (await session.execute(stmt)).scalar_one_or_none()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization team member not found.",
        )

    if (target_user.role or "").lower() == "owner":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant owner account cannot be disabled.",
        )

    current_role = (current_user.role or "").lower().strip()
    if current_role == "admin" and (target_user.role or "").lower() == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrators cannot disable other Administrators.",
        )

    target_user.is_active = payload.is_active

    if not payload.is_active:
        sessions_stmt = select(UserSession).where(
            UserSession.user_id == target_user.id,
            UserSession.is_active == True,
        )
        active_sessions = (await session.execute(sessions_stmt)).scalars().all()
        for s in active_sessions:
            s.is_active = False

    await session.commit()
    await session.refresh(target_user)

    action_text = "enabled" if payload.is_active else "disabled"
    log.info(f"User account '{target_user.username}' {action_text} by '{current_user.username}'.")

    return TenantMemberReadSchema.model_validate(target_user)


async def remove_tenant_user(
    target_user_id: uuid.UUID,
    payload: TenantUserRemoveSchema,
    session: AsyncSession,
    current_user: User,
) -> dict:
    """
    Remove/unbind a user member from the tenant.
    Requires 2FA TOTP verification if 2FA is active on the requesting account.
    Once removed, user can log in (if active), but has NO organization access.
    """
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization context required.",
        )

    if current_user.id == target_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove yourself from the organization.",
        )

    _verify_actor_totp_if_enabled(current_user, payload.totp_code)

    stmt = select(User).where(
        User.id == target_user_id,
        User.tenant_id == current_user.tenant_id,
    )
    target_user = (await session.execute(stmt)).scalar_one_or_none()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization team member not found.",
        )

    if (target_user.role or "").lower() == "owner":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization owner cannot be removed. Transfer ownership first.",
        )

    current_role = (current_user.role or "").lower().strip()
    if current_role == "admin" and (target_user.role or "").lower() == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrators cannot remove other Administrators.",
        )

    target_user.tenant_id = None
    target_user.role = None
    target_user.scopes = []
    target_user.is_active = False

    sessions_stmt = select(UserSession).where(
        UserSession.user_id == target_user.id,
        UserSession.is_active == True,
    )
    active_sessions = (await session.execute(sessions_stmt)).scalars().all()
    for s in active_sessions:
        s.is_active = False

    await session.commit()

    log.info(f"User '{target_user.username}' removed from tenant by '{current_user.username}'.")

    return {
        "status": "success",
        "message": f"User '{target_user.username}' removed from the organization successfully.",
    }


async def transfer_tenant_ownership(
    payload: TenantOwnershipTransferSchema,
    session: AsyncSession,
    current_user: User,
) -> dict:
    """
    Transfer organization ownership from the current owner to another member of the tenant.
    Requires 2FA TOTP verification if 2FA is enabled for the current owner.
    """
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization context required.",
        )

    current_role = (current_user.role or "").lower().strip()
    if current_role != "owner" and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the current Organization Owner can transfer ownership.",
        )

    if current_user.id == payload.target_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already the owner of this organization.",
        )

    _verify_actor_totp_if_enabled(current_user, payload.totp_code)

    target_stmt = select(User).where(
        User.id == payload.target_user_id,
        User.tenant_id == current_user.tenant_id,
    )
    target_user = (await session.execute(target_stmt)).scalar_one_or_none()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target user not found in your organization.",
        )

    if not target_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot transfer ownership to an inactive user account.",
        )

    previous_owner_name = f"{current_user.first_name} {current_user.last_name}".strip()
    new_owner_name = f"{target_user.first_name} {target_user.last_name}".strip()

    current_user.role = "admin"
    target_user.role = "owner"
    target_user.scopes = ["*"]

    await session.commit()

    tenant_stmt = select(Tenant).where(Tenant.id == current_user.tenant_id)
    tenant = (await session.execute(tenant_stmt)).scalar_one_or_none()
    tenant_name = tenant.name if tenant else "Organization"

    async def _send_ownership_transfer_email():
        try:
            transfer_date = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
            await email_service.send_html_email(
                to_email=target_user.email,
                subject=f"Ownership Transferred - {tenant_name}",
                template_name="auth/tenant_ownership_transferred.html",
                context={
                    "project_title": settings.PROJECT_TITLE,
                    "recipient_name": new_owner_name,
                    "tenant_name": tenant_name,
                    "new_owner_name": new_owner_name,
                    "new_owner_email": target_user.email,
                    "previous_owner_name": previous_owner_name,
                    "transfer_date": transfer_date,
                },
            )
            log.info(f"Ownership transfer email dispatched to new owner '{target_user.email}'.")
        except Exception as exc:
            log.error(f"Failed to send ownership transfer email to '{target_user.email}': {exc}")

    asyncio.create_task(_send_ownership_transfer_email())

    return {
        "status": "success",
        "message": f"Organization ownership transferred to {new_owner_name} ({target_user.email}).",
        "new_owner_id": str(target_user.id),
        "previous_owner_role": "admin",
    }
