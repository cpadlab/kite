import uuid
from typing import Literal, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_tenant_owner_or_admin
from app.database.postgres import get_db_session
from app.models.iam import User
from app.schemas.iam.tenant_user import (
    PaginatedTenantInvitationResponseSchema,
    PaginatedTenantMemberResponseSchema,
    TenantMemberReadSchema,
    TenantOwnershipTransferSchema,
    TenantUserInviteResponseSchema,
    TenantUserInviteSchema,
    TenantUserRoleUpdateSchema,
    TenantUserScopesUpdateSchema,
)
from app.controllers.iam.tenant_user import (
    invite_tenant_user,
    list_tenant_invitations,
    list_tenant_members,
    remove_tenant_user,
    revoke_tenant_invitation,
    transfer_tenant_ownership,
    update_tenant_user_role,
    update_tenant_user_scopes,
)

router = APIRouter(prefix="/tenants/current", tags=["Tenant User & Team Management"])


@router.post(
    "/users/invite",
    response_model=TenantUserInviteResponseSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Invite a new user to the organization (Tenant Owner or Admin only)",
)
async def invite_user(
    payload: TenantUserInviteSchema,
    current_user: User = Depends(get_current_tenant_owner_or_admin),
    db: AsyncSession = Depends(get_db_session),
) -> TenantUserInviteResponseSchema:
    """
    POST /tenants/current/users/invite
    -
    Dispatches an invitation email to a new user with an assigned role ('admin' or 'analyst')
    and granular system scopes. Requires Tenant Owner or Admin authorization.
    """
    return await invite_tenant_user(
        payload=payload,
        session=db,
        current_user=current_user,
    )


@router.get(
    "/invitations",
    response_model=PaginatedTenantInvitationResponseSchema,
    status_code=status.HTTP_200_OK,
    summary="List paginated invitations for the current organization",
)
async def get_invitations(
    search: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    sort_order: Literal["asc", "desc"] = Query(default="desc"),
    current_user: User = Depends(get_current_tenant_owner_or_admin),
    db: AsyncSession = Depends(get_db_session),
) -> PaginatedTenantInvitationResponseSchema:
    """
    GET /tenants/current/invitations
    -
    Returns all sent user invitations for the current tenant with tracking status ('pending', 'accepted', 'revoked', 'expired').
    """
    return await list_tenant_invitations(
        session=db,
        current_user=current_user,
        search=search,
        page=page,
        page_size=page_size,
        sort_order=sort_order,
    )


@router.delete(
    "/invitations/{invitation_id}",
    status_code=status.HTTP_200_OK,
    summary="Revoke a pending user invitation token",
)
async def cancel_invitation(
    invitation_id: uuid.UUID,
    current_user: User = Depends(get_current_tenant_owner_or_admin),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """
    DELETE /tenants/current/invitations/{invitation_id}
    -
    Revokes a pending invitation token so it can no longer be used for registration.
    """
    return await revoke_tenant_invitation(
        invitation_id=invitation_id,
        session=db,
        current_user=current_user,
    )


@router.get(
    "/users",
    response_model=PaginatedTenantMemberResponseSchema,
    status_code=status.HTTP_200_OK,
    summary="List paginated active member users of the organization",
)
async def get_members(
    search: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    sort_order: Literal["asc", "desc"] = Query(default="desc"),
    current_user: User = Depends(get_current_tenant_owner_or_admin),
    db: AsyncSession = Depends(get_db_session),
) -> PaginatedTenantMemberResponseSchema:
    """
    GET /tenants/current/users
    -
    Returns paginated user members of the organization.
    """
    return await list_tenant_members(
        session=db,
        current_user=current_user,
        search=search,
        page=page,
        page_size=page_size,
        sort_order=sort_order,
    )


@router.patch(
    "/users/{user_id}/role",
    response_model=TenantMemberReadSchema,
    status_code=status.HTTP_200_OK,
    summary="Update the role of an organization member (admin or analyst)",
)
async def update_role(
    user_id: uuid.UUID,
    payload: TenantUserRoleUpdateSchema,
    current_user: User = Depends(get_current_tenant_owner_or_admin),
    db: AsyncSession = Depends(get_db_session),
) -> TenantMemberReadSchema:
    """
    PATCH /tenants/current/users/{user_id}/role
    -
    Updates a user member's role to 'admin' or 'analyst'.
    Administrators cannot demote other Administrators or the Owner.
    """
    return await update_tenant_user_role(
        target_user_id=user_id,
        payload=payload,
        session=db,
        current_user=current_user,
    )


@router.patch(
    "/users/{user_id}/scopes",
    response_model=TenantMemberReadSchema,
    status_code=status.HTTP_200_OK,
    summary="Update assigned scopes for an organization member",
)
async def update_scopes(
    user_id: uuid.UUID,
    payload: TenantUserScopesUpdateSchema,
    current_user: User = Depends(get_current_tenant_owner_or_admin),
    db: AsyncSession = Depends(get_db_session),
) -> TenantMemberReadSchema:
    """
    PATCH /tenants/current/users/{user_id}/scopes
    -
    Updates granular system scopes assigned to an analyst or admin.
    """
    return await update_tenant_user_scopes(
        target_user_id=user_id,
        payload=payload,
        session=db,
        current_user=current_user,
    )


@router.post(
    "/transfer-ownership",
    status_code=status.HTTP_200_OK,
    summary="Transfer organization ownership to another team member (Owner Only with 2FA check)",
)
async def transfer_ownership(
    payload: TenantOwnershipTransferSchema,
    current_user: User = Depends(get_current_tenant_owner_or_admin),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """
    POST /tenants/current/transfer-ownership
    -
    Transfers Organization Owner status to a target member.
    Demotes current owner to 'admin' and promotes target user to 'owner' with full access (*).
    Requires a valid 2FA TOTP code if 2FA is active on the owner account.
    """
    return await transfer_tenant_ownership(
        payload=payload,
        session=db,
        current_user=current_user,
    )


@router.delete(
    "/users/{user_id}",
    status_code=status.HTTP_200_OK,
    summary="Remove a user member from the organization",
)
async def delete_member(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_tenant_owner_or_admin),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """
    DELETE /tenants/current/users/{user_id}
    -
    Removes a member from the tenant organization and revokes access.
    The tenant owner cannot be removed via this endpoint.
    """
    return await remove_tenant_user(
        target_user_id=user_id,
        session=db,
        current_user=current_user,
    )
