from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError

from app.core.config import settings

ph = PasswordHasher(
    time_cost=settings.ARGON2_TIME_COST,
    memory_cost=settings.ARGON2_MEMORY_COST,
    parallelism=settings.ARGON2_PARALLELISM,
    hash_len=settings.ARGON2_HASH_LEN,
    salt_len=settings.ARGON2_SALT_LEN,
)


def hash_password(password: str) -> str:
    """
    Compute a secure Argon2id cryptographic hash for a plaintext password.

    Args:
        password: The raw plaintext password string to hash.

    Returns:
        The fully encoded Argon2id string containing algorithm type, version,
        cost parameters, salt, and resulting digest.
    """
    return ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plaintext candidate password against a stored Argon2id hash.

    Args:
        plain_password: The plaintext candidate password to validate.
        hashed_password: The stored Argon2id encoded hash string.

    Returns:
        `True` if the plaintext password matches the hash, `False` if there is a
        digest mismatch, corrupted hash format, or verification failure.
    """
    try:
        return ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, InvalidHashError, Exception):
        return False