import uuid
import pyotp
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import TwoFactorInvalidError
from app.models.iam import User
from app.schemas.iam import TOTPSetupResponseSchema, Verify2FAPayloadSchema
from app.shared.email import email_service
from app.shared.logger import log


async def generate_totp_setup(session: AsyncSession, user: User) -> TOTPSetupResponseSchema:
    """
    Generate or retrieve a TOTP secret and backup codes.
    If the user has already initialized a secret (but 2FA is not enabled yet),
    we reuse that secret to prevent creating duplicate active secrets.
    If 2FA is already enabled, it prevents re-generating setup.

    Args:
        session: Active database session.
        user: The target user entity.

    Returns:
        A TOTPSetupResponseSchema containing secret, QR URI, and emergency codes.

    Raises:
        TwoFactorInvalidError: If 2FA is already enabled.
    """
    if user.is_2fa_enabled:
        raise TwoFactorInvalidError("Two-factor authentication is already enabled on this account.")

    if user.totp_secret:
        secret = user.totp_secret
        backup_codes = user.backup_codes
    else:
        secret = pyotp.random_base32()
        backup_codes = [uuid.uuid4().hex[:8].upper() for _ in range(8)]
        user.totp_secret = secret
        user.backup_codes = backup_codes
        await session.commit()

    totp = pyotp.TOTP(secret)
    qr_uri = totp.provisioning_uri(
        name=user.email,
        issuer_name=settings.PROJECT_TITLE,
    )

    return TOTPSetupResponseSchema(
        totp_secret=secret,
        qr_code_uri=qr_uri,
        backup_codes=backup_codes,
    )


async def verify_and_enable_totp(
    session: AsyncSession,
    user: User,
    code: str,
) -> bool:
    """
    Verify a test 2FA TOTP code and enable 2FA on the user account.
    Validates against the statefully stored secret.

    Args:
        session: Active database session.
        user: Target user entity.
        code: 6-digit TOTP verification code.

    Returns:
        True if verification and activation succeeded.

    Raises:
        TwoFactorInvalidError: If the TOTP verification code is incorrect or 2FA setup is not initialized.
    """
    if user.is_2fa_enabled:
        raise TwoFactorInvalidError("Two-factor authentication is already enabled.")

    if not user.totp_secret:
        raise TwoFactorInvalidError("Two-factor authentication has not been initialized for setup.")

    totp = pyotp.TOTP(user.totp_secret)
    if not totp.verify(code):
        raise TwoFactorInvalidError("Invalid verification code.")

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
                "disabled": False,
            },
        )
    except Exception as exc:
        log.error(f"Failed to dispatch 2FA alert email for {user.username}: {exc}")

    return True


async def disable_totp(
    session: AsyncSession,
    user: User,
    code: str,
) -> bool:
    """
    Disable two-factor authentication on the user account.
    For cybersecurity purposes, this requires verifying a current TOTP code or a backup code.

    Args:
        session: Active database session.
        user: Target user entity.
        code: 6-digit TOTP verification code or emergency backup code.

    Returns:
        True if 2FA was successfully disabled.

    Raises:
        TwoFactorInvalidError: If 2FA is not active or code validation fails.
    """
    if not user.is_2fa_enabled:
        raise TwoFactorInvalidError("Two-factor authentication is not enabled.")

    totp = pyotp.TOTP(user.totp_secret)
    is_totp_valid = totp.verify(code)

    is_backup_valid = False
    if not is_totp_valid and user.backup_codes:
        upper_code = code.strip().upper()
        if upper_code in user.backup_codes:
            is_backup_valid = True

    if not is_totp_valid and not is_backup_valid:
        raise TwoFactorInvalidError("Invalid 2FA verification code or backup code.")

    user.is_2fa_enabled = False
    user.totp_secret = None
    user.backup_codes = []
    await session.commit()

    try:
        await email_service.send_email(
            to=user.email,
            subject=f"[{settings.PROJECT_TITLE}] SECURITY ALERT: 2FA Disabled",
            template_name="auth/2fa_alert.html",
            context={
                "recipient_name": f"{user.first_name} {user.last_name}",
                "username": user.username,
                "disabled": True,
            },
        )
    except Exception as exc:
        log.error(f"Failed to dispatch 2FA disable alert email for {user.username}: {exc}")

    return True


async def handle_totp_setup(
    session: AsyncSession,
    current_user: User,
) -> TOTPSetupResponseSchema:
    """
    Controller wrapper to generate/retrieve TOTP setup credentials for the current user.
    """
    try:
        return await generate_totp_setup(session, current_user)
    except TwoFactorInvalidError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except Exception as exc:
        log.error(f"Unexpected error during TOTP setup: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during 2FA setup.",
        )


async def handle_totp_enable(
    payload: Verify2FAPayloadSchema,
    session: AsyncSession,
    current_user: User,
) -> dict[str, str]:
    """
    Controller wrapper to verify the test code and enable TOTP 2FA.
    """
    try:
        await verify_and_enable_totp(
            session=session,
            user=current_user,
            code=payload.code,
        )
        return {
            "status": "enabled",
            "message": "Two-factor authentication enabled successfully.",
        }
    except TwoFactorInvalidError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except Exception as exc:
        log.error(f"Unexpected error enabling TOTP: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while enabling 2FA.",
        )


async def handle_totp_disable(
    payload: Verify2FAPayloadSchema,
    session: AsyncSession,
    current_user: User,
) -> dict[str, str]:
    """
    Controller wrapper to verify a challenge and disable TOTP 2FA.
    """
    try:
        await disable_totp(
            session=session,
            user=current_user,
            code=payload.code,
        )
        return {
            "status": "disabled",
            "message": "Two-factor authentication disabled successfully.",
        }
    except TwoFactorInvalidError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except Exception as exc:
        log.error(f"Unexpected error disabling TOTP: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while disabling 2FA.",
        )
