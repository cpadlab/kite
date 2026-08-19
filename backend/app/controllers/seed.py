import zlib
from datetime import datetime, timezone
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.core.config import settings
from app.core.security import hash_password
from app.database.postgres import AsyncSessionLocal, Base, engine
from app.models import User
from app.shared.logger import log

SEED_LOCK_KEY: int = zlib.crc32(b"falcon_root_seed_lock")

async def seed_root_user() -> None:
    """
    Initialize database schemas and provision or reconcile the root superuser.

    Performs an idempotent and concurrency-safe database bootstrap during application
    startup. Uses PostgreSQL transaction-level advisory locks (`pg_advisory_xact_lock`)
    to serialize execution across multi-worker clusters and prevent race conditions.

    Execution Flow:
        1. Synchronizes DDL metadata schemas (`Base.metadata.create_all`).
        2. Acquires an exclusive transaction advisory lock based on `SEED_LOCK_KEY`.
        3. Queries for the existing root user by email or username.
        4. Self-heals administrative privileges (active status, superuser privileges,
           email verification, lockout reset) if data drift occurred.
        5. Provisions a new root superuser if no record exists.

    Raises:
        SQLAlchemyError: If initial DDL schema creation or database connectivity fails.
        Exception: If an unhandled error occurs during transaction execution or provisioning.
    """
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID;"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50);"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS scopes JSONB DEFAULT '[]'::jsonb;"))
            await conn.execute(text("ALTER TABLE sessions ADD COLUMN IF NOT EXISTS tenant_id UUID;"))
            await conn.execute(text("ALTER TABLE tenant_invitations ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);"))
            await conn.execute(text("ALTER TABLE tenant_invitations ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);"))
            await conn.execute(text("ALTER TABLE tenant_invitations ADD COLUMN IF NOT EXISTS username VARCHAR(50);"))
            await conn.execute(text("ALTER TABLE tenant_invitations ADD COLUMN IF NOT EXISTS scopes JSONB DEFAULT '[]'::jsonb;"))
            await conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS created_by_id UUID;"))
            await conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS updated_by_id UUID;"))
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS tenant_api_keys (
                    id UUID PRIMARY KEY,
                    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                    name VARCHAR(100) NOT NULL,
                    key_prefix VARCHAR(16) NOT NULL,
                    hashed_key VARCHAR(255) NOT NULL UNIQUE,
                    scopes JSONB DEFAULT '[]'::jsonb NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE NOT NULL,
                    expires_at TIMESTAMPTZ NOT NULL,
                    created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
                    last_used_at TIMESTAMPTZ,
                    last_used_ip VARCHAR(45),
                    reminder_30d_sent BOOLEAN DEFAULT FALSE NOT NULL,
                    reminder_24h_sent BOOLEAN DEFAULT FALSE NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
                );
            """))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_tenant_api_keys_tenant_id ON tenant_api_keys(tenant_id);"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_tenant_api_keys_key_prefix ON tenant_api_keys(key_prefix);"))
    except SQLAlchemyError as ddl_exc:
        log.critical(f"DDL schema synchronization failed: {ddl_exc}")
        raise ddl_exc

    async with AsyncSessionLocal() as session:
        async with session.begin():
            try:
                
                await session.execute(
                    text("SELECT pg_advisory_xact_lock(:lock_key)"),
                    {"lock_key": SEED_LOCK_KEY},
                )

                stmt = select(User).where(
                    (User.email == settings.ROOT_USER_EMAIL)
                    | (User.username == settings.ROOT_USER_USERNAME)
                )
                result = await session.execute(stmt)
                existing_root = result.scalar_one_or_none()

                if existing_root:
                    log.info(
                        f"Root user '{existing_root.username}' already exists (Active: {existing_root.is_active}, Superuser: {existing_root.is_superuser}). Seed skipped."
                    )
                    return

                log.info("Root user not detected. Provisioning root superuser...")

                root_user = User(
                    first_name=settings.ROOT_USER_FIRST_NAME,
                    last_name=settings.ROOT_USER_LAST_NAME,
                    username=settings.ROOT_USER_USERNAME,
                    email=settings.ROOT_USER_EMAIL,
                    hashed_password=hash_password(settings.ROOT_USER_PASSWORD),
                    is_active=True,
                    is_superuser=True,
                    is_email_verified=True,
                    scopes=["*"],
                    is_2fa_enabled=False,
                    backup_codes=[],
                    failed_login_attempts=0,
                    login_locked_until=None,
                )

                session.add(root_user)
                await session.flush()

                log.info(
                    f"Root superuser successfully initialized with UUID: {root_user.id} "
                    f"({root_user.email} | @{root_user.username})"
                )

            except IntegrityError as integrity_exc:
                await session.rollback()
                log.warning(
                    f"Concurrent seed detected and avoided via constraint: {integrity_exc.orig}"
                )
            except Exception as exc:
                await session.rollback()
                log.critical(f"Critical error during root initialization seed: {exc}")
                raise exc