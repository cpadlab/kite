from fastapi import APIRouter, Depends, Header, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.database.postgres import get_db_session
from app.models.iam import User
from app.schemas.iam import (
    LoginCredentialsSchema,
    TokenResponseSchema,
    TOTPSetupResponseSchema,
    Verify2FAPayloadSchema,
    UserReadSchema,
)
from app.controllers.iam import (
    handle_login,
    handle_totp_setup,
    handle_totp_enable,
    handle_totp_disable,
)

router = APIRouter(prefix="/auth", tags=["Authentication & IAM"])


@router.post(
    "/login",
    response_model=TokenResponseSchema,
    status_code=status.HTTP_200_OK,
    summary="Authenticate user and issue JWT token",
)
async def login(
    credentials: LoginCredentialsSchema,
    request: Request,
    db: AsyncSession = Depends(get_db_session),
    user_agent: str | None = Header(default=None, alias="User-Agent"),
) -> TokenResponseSchema:
    """
    POST /auth/login
    -
    Authenticates a user via identifier (email or username) and password using Argon2id,
    issuing scoped JSON Web Tokens (JWT) upon successful credential verification.
    """
    return await handle_login(
        credentials=credentials,
        request=request,
        db=db,
        user_agent=user_agent,
    )


@router.post(
    "/2fa/setup",
    response_model=TOTPSetupResponseSchema,
    status_code=status.HTTP_200_OK,
    summary="Generate or retrieve TOTP secret and QR code URI for 2FA",
)
async def setup_2fa(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> TOTPSetupResponseSchema:
    """
    POST /auth/2fa/setup
    -
    Generates a new TOTP secret, provisioning QR URI, and emergency backup codes,
    or retrieves the existing ones if 2FA has already been initialized but not enabled.
    Requires bearer token authentication.
    """
    return await handle_totp_setup(session=db, current_user=current_user)


@router.post(
    "/2fa/enable",
    status_code=status.HTTP_200_OK,
    summary="Verify and enable TOTP 2FA",
)
async def enable_2fa(
    payload: Verify2FAPayloadSchema,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, str]:
    """
    POST /auth/2fa/enable
    -
    Verifies a test 6-digit TOTP code against the initialized secret and enables 2FA.
    Requires bearer token authentication.
    """
    return await handle_totp_enable(payload=payload, session=db, current_user=current_user)


@router.post(
    "/2fa/disable",
    status_code=status.HTTP_200_OK,
    summary="Disable TOTP 2FA",
)
async def disable_2fa(
    payload: Verify2FAPayloadSchema,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, str]:
    """
    POST /auth/2fa/disable
    -
    Disables 2FA on the user account. For security purposes, this request must
    be verified by providing a current TOTP code or an emergency backup code.
    Requires bearer token authentication.
    """
    return await handle_totp_disable(payload=payload, session=db, current_user=current_user)


@router.get(
    "/me",
    response_model=UserReadSchema,
    status_code=status.HTTP_200_OK,
    summary="Get profile details of the currently authenticated user",
)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    GET /auth/me
    -
    Returns the profile details of the currently authenticated user session.
    Requires bearer token authentication.
    """
    return current_user