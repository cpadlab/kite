import uuid
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import Boolean, Integer, String, BigInteger, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.models import BaseModel

if TYPE_CHECKING:
    from app.models.iam.user import User
    from app.models.iam.invitation import TenantInvitation


class Tenant(BaseModel):
    """
    Tenant entity representing an isolated company or organization.
    Supports non-unique display names, user license limits, and storage quotas.
    """
    __tablename__ = "tenants"

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(255), nullable=True, index=True)

    max_users: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    storage_quota_gb: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    storage_used_bytes: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    updated_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    users: Mapped[List["User"]] = relationship(
        "User",
        back_populates="tenant",
        cascade="all, delete-orphan",
        foreign_keys="User.tenant_id",
    )
    invitations: Mapped[List["TenantInvitation"]] = relationship(
        "TenantInvitation", back_populates="tenant", cascade="all, delete-orphan"
    )

    created_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[created_by_id])
    updated_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[updated_by_id])
