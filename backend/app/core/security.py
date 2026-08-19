import uuid
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.database.postgres import get_db_session
from app.models.iam import User, UserSession

ph = PasswordHasher(
    time_cost=settings.ARGON2_TIME_COST,
    memory_cost=settings.ARGON2_MEMORY_COST,
    parallelism=settings.ARGON2_PARALLELISM,
    hash_len=settings.ARGON2_HASH_LEN,
    salt_len=settings.ARGON2_SALT_LEN,
)

security = HTTPBearer(auto_error=True)


def hash_password(password: str) -> str:
    """
    Compute a secure Argon2id cryptographic hash for a plaintext password.
    """
    return ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plaintext candidate password against a stored Argon2id hash.
    """
    try:
        return ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, InvalidHashError, Exception):
        return False


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db_session),
) -> User:
    """
    FastAPI dependency to extract and validate the JWT bearer token from the request.
    Verifies token signature, expiration, and checks the database to ensure the session
    has not been revoked.
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        user_id_str = payload.get("sub")
        jti = payload.get("jti")
        if not user_id_str or not jti:
            raise ValueError("Token is missing standard claims.")
        user_id = uuid.UUID(user_id_str)
    except (jwt.PyJWTError, ValueError, KeyError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    session_stmt = select(UserSession).where(
        UserSession.token_jti == jti,
        UserSession.user_id == user_id,
        UserSession.is_active == True,
    )
    session_result = await db.execute(session_stmt)
    active_session = session_result.scalar_one_or_none()

    if not active_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication session has been revoked or expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_stmt = select(User).where(User.id == user_id)
    user_result = await db.execute(user_stmt)
    user = user_result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated or inactive.",
        )

    return user


get_current_active_user = get_current_user


async def get_current_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    FastAPI dependency ensuring the authenticated user is an active superuser.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superuser administrative privileges required to perform this action.",
        )
        
    return current_user


async def get_current_tenant_owner_or_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    FastAPI dependency ensuring the authenticated user belongs to an organization
    and has 'owner' or 'admin' role. Superusers with tenant context are also permitted.
    """
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This operation requires an assigned organization context.",
        )

    user_role = (current_user.role or "").lower().strip()
    if user_role not in ("owner", "admin") and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Tenant Owners and Administrators are authorized to perform this action.",
        )

    return current_user