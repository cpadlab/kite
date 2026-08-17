import uuid
from datetime import datetime, timedelta, timezone
import jwt
import pyotp
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import (
    AccountDisabledError,
    AccountLockedError,
    AuthenticationError,
    TwoFactorInvalidError,
    TwoFactorRequiredError,
)
from app.core.security import verify_password
from app.domains.iam.models import User, UserSession
from app.domains.iam.schemas import (
    LoginCredentialsSchema,
    TokenResponseSchema,
    TOTPSetupResponseSchema,
)
from app.shared.email import email_service
from app.shared.logger import log


class IAMService:
    """
    Enterprise Identity & Access Management (IAM) Service.
    
    Provides multi-tenant authorization, scope enforcement, Argon2id verification,
    TOTP 2FA, brute-force lockout, session tracking, and email security alerts.
    """

    @staticmethod
    def _parse_device_type(user_agent: str | None) -> str:
        """
        Determine the broad device category from an incoming User-Agent string.

        Args:
            user_agent: The raw User-Agent HTTP request header string.

        Returns:
            A descriptive device category string ('Mobile', 'Tablet', 'API Client / Bot', 'Desktop', or 'Unknown').
        """
        if not user_agent:
            return "Unknown"
        ua_lower = user_agent.lower()
        if "mobile" in ua_lower or "android" in ua_lower or "iphone" in ua_lower:
            return "Mobile"
        if "tablet" in ua_lower or "ipad" in ua_lower:
            return "Tablet"
        if "postman" in ua_lower or "curl" in ua_lower or "httpie" in ua_lower or "python" in ua_lower:
            return "API Client / Bot"
        return "Desktop"

    @classmethod
    def create_access_token(
        cls,
        user_id: uuid.UUID,
        username: str,
        email: str,
        is_superuser: bool,
        tenant_id: uuid.UUID | None,
        scopes: list[str],
        jti: str,
        expires_delta: timedelta,
    ) -> tuple[str, datetime]:
        """
        Generate a signed JWT token embedded with Tenant ID, Scopes, JTI, and standard claims.

        Args:
            user_id: Unique UUID identifier of the authenticated user.
            username: User account handle.
            email: Primary email address of the user.
            is_superuser: Administrative privilege status flag.
            tenant_id: Multi-tenant organization UUID context.
            scopes: List of granted permission strings or scopes.
            jti: Unique JSON Web Token Identifier for session tracking.
            expires_delta: Duration until token expiration.

        Returns:
            A tuple containing the encoded JWT string and its UTC expiration datetime.
        """
        now = datetime.now(timezone.utc)
        expires_at = now + expires_delta

        payload = {
            "sub": str(user_id),
            "username": username,
            "email": email,
            "is_superuser": is_superuser,
            "tenant_id": str(tenant_id) if tenant_id else None,
            "scopes": scopes if not is_superuser else ["*"],
            "jti": jti,
            "iat": int(now.timestamp()),
            "exp": int(expires_at.timestamp()),
            "nbf": int(now.timestamp()),
            "iss": settings.PROJECT_TITLE,
        }

        token = jwt.encode(
            payload,
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM,
        )

        return token, expires_at

    @classmethod
    def create_pre_auth_token(cls, user_id: uuid.UUID) -> str:
        """
        Generate a short-lived token for the second factor (2FA) verification step.

        Args:
            user_id: Unique UUID of the pending user account.

        Returns:
            An encoded short-lived pre-auth JWT string.
        """
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=settings.PRE_AUTH_EXPIRE_MINUTES)
        payload = {
            "sub": str(user_id),
            "type": "2fa_preauth",
            "iat": int(now.timestamp()),
            "exp": int(expires_at.timestamp()),
            "iss": settings.PROJECT_TITLE,
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    @classmethod
    def verify_pre_auth_token(cls, token: str) -> uuid.UUID:
        """
        Decode and validate a 2FA pre-authentication token.

        Args:
            token: The raw pre-auth JWT string.

        Returns:
            The verified user's UUID.

        Raises:
            AuthenticationError: If token signature is invalid, expired, or claims are malformed.
        """
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            if payload.get("type") != "2fa_preauth":
                raise AuthenticationError("Invalid pre-auth token scope.")
            return uuid.UUID(payload["sub"])
        except Exception:
            raise AuthenticationError("Invalid or expired 2FA pre-auth token.")

    @classmethod
    async def generate_totp_setup(cls, user: User) -> TOTPSetupResponseSchema:
        """
        Generate a new TOTP secret, provisioning QR URI, and 8 emergency backup codes.

        Args:
            user: The target user entity.

        Returns:
            A TOTPSetupResponseSchema containing secret, QR URI, and emergency codes.
        """
        secret = pyotp.random_base32()
        totp = pyotp.TOTP(secret)
        qr_uri = totp.provisioning_uri(
            name=user.email,
            issuer_name=settings.PROJECT_TITLE,
        )
        backup_codes = [uuid.uuid4().hex[:8].upper() for _ in range(8)]
        return TOTPSetupResponseSchema(
            totp_secret=secret,
            qr_code_uri=qr_uri,
            backup_codes=backup_codes,
        )

    @classmethod
    async def verify_and_enable_totp(
        cls,
        session: AsyncSession,
        user: User,
        totp_secret: str,
        code: str,
        backup_codes: list[str],
    ) -> bool:
        """
        Verify a test 2FA TOTP code and enable 2FA on the user account.

        Args:
            session: Active database session.
            user: Target user entity.
            totp_secret: Candidate base32 TOTP secret.
            code: 6-digit TOTP verification code.
            backup_codes: List of generated emergency backup codes.

        Returns:
            True if verification and activation succeeded.

        Raises:
            TwoFactorInvalidError: If the TOTP verification code is incorrect.
        """
        totp = pyotp.TOTP(totp_secret)
        if not totp.verify(code):
            raise TwoFactorInvalidError("Invalid verification code.")

        user.totp_secret = totp_secret
        user.backup_codes = backup_codes
        user.is_2fa_enabled = True
        await session.commit()

        try:
            await email_service.send_email(
                to=user.email,
                subject=f"[{settings.PROJECT_TITLE}] 2FA Enabled Successfully",
                template_name="auth/2fa_alert.html",
                context={
                    "recipient_name": f"{user.first_name} {user.last_name}",
                    "username": user.username,
                },
            )
        except Exception as exc:
            log.error(f"Failed to dispatch 2FA alert email for {user.username}: {exc}")

        return True

    @classmethod
    async def _detect_new_device(
        cls,
        session: AsyncSession,
        user_id: uuid.UUID,
        ip_address: str | None,
        user_agent: str | None,
    ) -> bool:
        """
        Determine whether an IP address or User-Agent string is unrecognized in user session history.

        Args:
            session: Active database session.
            user_id: UUID of the target user.
            ip_address: Client IP address string.
            user_agent: Raw HTTP User-Agent string.

        Returns:
            True if the device/location has never been seen before, False otherwise.
        """
        if not ip_address and not user_agent:
            return False

        stmt = select(UserSession).where(
            UserSession.user_id == user_id,
            or_(
                UserSession.ip_address == ip_address,
                UserSession.user_agent == user_agent,
            ),
        ).limit(1)
        result = await session.execute(stmt)
        existing_session = result.scalar_one_or_none()
        return existing_session is None

    @classmethod
    async def authenticate_user(
        cls,
        session: AsyncSession,
        credentials: LoginCredentialsSchema,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> TokenResponseSchema:
        """
        Execute full authentication pipeline:
        1. Find User by Email or Username.
        2. Verify Brute-Force Account Lockout status.
        3. Verify Active Status.
        4. Validate Argon2id Password Digest.
        5. Verify 2FA TOTP or Emergency Backup Code (if 2FA is active).
        6. Perform New Device Detection and trigger Email Alert.
        7. Persist UserSession record and issue multi-tenant JWT Token.

        Args:
            session: Active database session.
            credentials: Login credentials containing identifier, password, and optional TOTP code.
            ip_address: Client IP address.
            user_agent: Client User-Agent string.

        Returns:
            TokenResponseSchema containing access token or 2FA pre-auth instruction.

        Raises:
            AuthenticationError: On bad identifier or password.
            AccountLockedError: If account is locked due to brute force attempts.
            AccountDisabledError: If account is inactive.
            TwoFactorInvalidError: If supplied 2FA TOTP code is incorrect.
        """
        now = datetime.now(timezone.utc)

        stmt = select(User).where(
            or_(
                User.email == credentials.identifier.lower().strip(),
                User.username == credentials.identifier.strip(),
            )
        )
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            log.warning(f"Failed login attempt: non-existent identifier '{credentials.identifier}' from IP {ip_address}")
            raise AuthenticationError("Invalid identifier or password.")

        if user.login_locked_until:
            if user.login_locked_until > now:
                remaining_min = int((user.login_locked_until - now).total_seconds() // 60) + 1
                log.warning(f"Blocked login attempt on locked account '{user.username}' from IP {ip_address}")
                raise AccountLockedError(f"Account locked due to excessive failed attempts. Retry in {remaining_min} min.")
            else:
                user.login_locked_until = None
                user.failed_login_attempts = 0

        if not user.is_active:
            log.warning(f"Login attempt on inactive account '{user.username}' from IP {ip_address}")
            raise AccountDisabledError("User account is disabled. Contact your administrator.")

        is_password_valid = verify_password(credentials.password, user.hashed_password)

        if not is_password_valid:
            user.failed_login_attempts += 1
            log.warning(
                f"Invalid password for user '{user.username}' from IP {ip_address}. "
                f"Attempts: {user.failed_login_attempts}/{settings.MAX_FAILED_ATTEMPTS}"
            )

            if user.failed_login_attempts >= settings.MAX_FAILED_ATTEMPTS:
                user.login_locked_until = now + timedelta(minutes=settings.LOCKOUT_DURATION_MINUTES)
                log.error(f"User account '{user.username}' locked until {user.login_locked_until}")

            await session.commit()
            raise AuthenticationError("Invalid identifier or password.")

        if user.is_2fa_enabled:
            if not credentials.totp_code:
                pre_auth_token = cls.create_pre_auth_token(user.id)
                log.info(f"User '{user.username}' passed primary auth. 2FA TOTP code required.")
                return TokenResponseSchema(
                    requires_2fa=True,
                    pre_auth_token=pre_auth_token,
                )

            totp = pyotp.TOTP(user.totp_secret)
            is_totp_valid = totp.verify(credentials.totp_code)

            is_backup_valid = False
            if not is_totp_valid and user.backup_codes:
                upper_code = credentials.totp_code.strip().upper()
                if upper_code in user.backup_codes:
                    is_backup_valid = True
                    user.backup_codes.remove(upper_code)
                    log.info(f"User '{user.username}' used emergency 2FA backup code.")

            if not is_totp_valid and not is_backup_valid:
                user.failed_login_attempts += 1
                await session.commit()
                log.warning(f"Invalid 2FA code for user '{user.username}' from IP {ip_address}")
                raise TwoFactorInvalidError("Invalid 2FA verification code or backup code.")

        is_new_device = await cls._detect_new_device(session, user.id, ip_address, user_agent)
        device_type = cls._parse_device_type(user_agent)

        user.failed_login_attempts = 0
        user.login_locked_until = None
        user.last_login_at = now
        if not user.first_login_at:
            user.first_login_at = now

        token_jti = str(uuid.uuid4())
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        access_token, expires_at = cls.create_access_token(
            user_id=user.id,
            username=user.username,
            email=user.email,
            is_superuser=user.is_superuser,
            tenant_id=user.tenant_id,
            scopes=user.scopes or [],
            jti=token_jti,
            expires_delta=expires_delta,
        )

        user_session = UserSession(
            user_id=user.id,
            tenant_id=user.tenant_id,
            token_jti=token_jti,
            ip_address=ip_address,
            user_agent=user_agent,
            device_type=device_type,
            is_active=True,
            last_activity_at=now,
            expires_at=expires_at,
        )
        session.add(user_session)

        await session.commit()
        await session.refresh(user_session)

        log.info(f"User '{user.username}' authenticated. Session {user_session.id} created (New device: {is_new_device}).")

        try:
            await email_service.send_email(
                to=user.email,
                subject=f"[{settings.PROJECT_TITLE}] Security Alert: Sign-In from {device_type}",
                template_name="auth/login_notification.html",
                context={
                    "project_title": settings.PROJECT_TITLE,
                    "recipient_name": f"{user.first_name} {user.last_name}",
                    "username": user.username,
                    "ip_address": ip_address or "Unknown",
                    "device_type": device_type,
                    "user_agent": user_agent or "Unknown",
                    "login_time": now.strftime("%Y-%m-%d %H:%M:%S UTC"),
                    "is_new_device": is_new_device,
                },
            )
        except Exception as exc:
            log.error(f"Failed to send login notification email to {user.email}: {exc}")

        return TokenResponseSchema(
            access_token=access_token,
            token_type="bearer",
            expires_at=expires_at,
            session_id=user_session.id,
            user_id=user.id,
            tenant_id=user.tenant_id,
            scopes=user.scopes or [],
            requires_2fa=False,
        )

    @classmethod
    async def terminate_session(
        cls,
        session: AsyncSession,
        user_id: uuid.UUID,
        jti: str,
    ) -> bool:
        """
        Terminate and invalidate an active user session.

        Args:
            session: Active database session.
            user_id: Target user UUID.
            jti: JSON Web Token Identifier of the session to terminate.

        Returns:
            True if the session was found and deactivated, False otherwise.
        """
        stmt = select(UserSession).where(
            UserSession.user_id == user_id,
            UserSession.token_jti == jti,
            UserSession.is_active == True,
        )
        result = await session.execute(stmt)
        user_session = result.scalar_one_or_none()

        if user_session:
            user_session.is_active = False
            user_session.last_activity_at = datetime.now(timezone.utc)
            await session.commit()
            log.info(f"Session {user_session.id} for user {user_id} terminated.")
            return True

        return False


iam_service = IAMService()
