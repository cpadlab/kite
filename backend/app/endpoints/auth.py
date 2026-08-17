from fastapi import APIRouter, Depends, Header, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.postgres import get_db_session
from app.schemas.iam import LoginCredentialsSchema, TokenResponseSchema
from app.controllers.iam import handle_login

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