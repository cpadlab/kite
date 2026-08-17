from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AccountDisabledError, AccountLockedError, AuthenticationError, TwoFactorInvalidError
from app.database.postgres import get_db_session
from app.domains.iam.schemas import LoginCredentialsSchema, TokenResponseSchema, TOTPSetupResponseSchema, Verify2FAPayloadSchema
from app.domains.iam.service import iam_service
from app.shared.logger import log

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

    Features and Security Checks:
    - Verifies identity using username or email with constant-time password matching.
    - Mitigates brute-force attacks via progressive delays and temporary account lockouts.
    - Validates TOTP two-factor authentication (2FA) challenges and backup codes.
    - Injects tenant boundaries (`tenant_id`) and authorization scopes into token claims.
    - Tracks client IP and User-Agent metadata to dispatch suspicious login alerts.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"

    x_forwarded_for = request.headers.get("X-Forwarded-For")
    if x_forwarded_for:
        client_ip = x_forwarded_for.split(",")[0].strip()

    try:
        
        token_response = await iam_service.authenticate_user(
            session=db,
            credentials=credentials,
            ip_address=client_ip,
            user_agent=user_agent,
        )
        return token_response

    except AuthenticationError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        )
    except AccountLockedError as exc:
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=str(exc),
        )
    except AccountDisabledError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        )
    except TwoFactorInvalidError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except Exception as exc:
        log.error(f"Unexpected error during login execution: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal authentication error occurred.",
        )