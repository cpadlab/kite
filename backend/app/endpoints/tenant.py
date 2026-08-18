from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_superuser
from app.database.postgres import get_db_session
from app.models.iam import User
from app.schemas.iam.tenant import (
    AcceptInvitationSchema,
    TenantCreateSchema,
    TenantInvitationPublicSchema,
    TenantReadSchema,
)
from app.controllers.iam.tenant import (
    accept_tenant_invitation,
    create_tenant_and_invite_owner,
    list_all_tenants,
    validate_invitation_token,
)

router = APIRouter(prefix="/tenants", tags=["Tenants & Multi-Tenancy Management"])


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Register a new Tenant and dispatch Owner registration invitation token (Superuser Only)",
)
async def create_tenant(
    payload: TenantCreateSchema,
    current_user: User = Depends(get_current_superuser),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """
    POST /tenants
    -
    Registers a new Tenant company (with user limits and storage quota) and dispatches
    a secure registration invitation email to the designated owner.
    Requires Superuser authorization.
    """
    return await create_tenant_and_invite_owner(
        payload=payload,
        session=db,
        current_superuser=current_user,
    )


@router.get(
    "",
    response_model=list[TenantReadSchema],
    status_code=status.HTTP_200_OK,
    summary="List all tenant organizations (Superuser Only)",
)
async def get_all_tenants(
    current_user: User = Depends(get_current_superuser),
    db: AsyncSession = Depends(get_db_session),
) -> list[TenantReadSchema]:
    """
    GET /tenants
    -
    Returns a list of all tenant organizations registered in the platform.
    Requires Superuser authorization.
    """
    return await list_all_tenants(session=db, current_superuser=current_user)


@router.get(
    "/invitations/{token}",
    response_model=TenantInvitationPublicSchema,
    status_code=status.HTTP_200_OK,
    summary="Validate invitation token details for registration page",
)
async def get_invitation_info(
    token: str,
    db: AsyncSession = Depends(get_db_session),
) -> TenantInvitationPublicSchema:
    """
    GET /tenants/invitations/{token}
    -
    Public endpoint to validate registration tokens and display organization name on the /register?token=XXX page.
    """
    return await validate_invitation_token(token=token, session=db)


@router.post(
    "/invitations/accept",
    status_code=status.HTTP_200_OK,
    summary="Complete tenant owner registration using invitation token",
)
async def accept_invitation(
    payload: AcceptInvitationSchema,
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    """
    POST /tenants/invitations/accept
    -
    Completes tenant owner registration on the /register?token=XXX flow.
    Enforces that a user can only belong to ONE tenant.
    """
    return await accept_tenant_invitation(payload=payload, session=db)
