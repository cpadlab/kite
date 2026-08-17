class BaseAppException(Exception):
    """
    Base exception class for custom application-level exceptions.

    Provides a consistent root hierarchy for catching and handling domain-specific
    errors throughout the application runtime.
    """

    def __init__(self, message: str = "An unexpected application error occurred.") -> None:
        """
        Initialize the base application exception.

        Args:
            message: Human-readable error description message.
        """
        self.message = message
        super().__init__(self.message)


class AuthenticationError(BaseAppException):
    """
    Exception raised for invalid credentials or authentication failures.

    Triggered when an identifier (email/username) does not exist or when an
    invalid password is provided during authentication.
    """

    def __init__(self, message: str = "Invalid identifier or password.") -> None:
        """
        Initialize authentication failure exception.

        Args:
            message: Detailed explanation of the authentication failure.
        """
        super().__init__(message)


class AccountLockedError(BaseAppException):
    """
    Exception raised when the account is temporarily locked due to failed attempts.

    Triggered when consecutive failed login attempts reach or exceed the configured
    threshold (`settings.MAX_FAILED_ATTEMPTS`).
    """

    def __init__(self, message: str = "Account locked due to excessive failed attempts.") -> None:
        """
        Initialize account lockout exception.

        Args:
            message: Detailed explanation of the account lock state and retry duration.
        """
        super().__init__(message)


class AccountDisabledError(BaseAppException):
    """
    Exception raised when the user account is marked inactive.

    Triggered when an inactive or suspended user attempts to log in to the application.
    """

    def __init__(self, message: str = "User account is disabled. Contact your administrator.") -> None:
        """
        Initialize account disabled exception.

        Args:
            message: Explanation for the deactivated account status.
        """
        super().__init__(message)


class TwoFactorRequiredError(BaseAppException):
    """
    Exception raised when 2FA TOTP verification is required to complete authentication.

    Triggered when a user passes primary password authentication but has 2FA enabled,
    requiring a valid TOTP code step.
    """

    def __init__(self, message: str = "Two-factor authentication code is required.") -> None:
        """
        Initialize 2FA required exception.

        Args:
            message: Contextual instruction to supply a 2FA TOTP token.
        """
        super().__init__(message)


class TwoFactorInvalidError(BaseAppException):
    """
    Exception raised when the provided 2FA code is invalid or expired.

    Triggered when a candidate 6-digit TOTP code or emergency backup code fails verification.
    """

    def __init__(self, message: str = "Invalid 2FA verification code or backup code.") -> None:
        """
        Initialize 2FA invalid code exception.

        Args:
            message: Explanation of the invalid 2FA token input.
        """
        super().__init__(message)
