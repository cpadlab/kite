import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.models import BaseModel

if TYPE_CHECKING:
    from app.models.iam.tenant import Tenant
    from app.models.iam.user import User


class TenantApiKey(BaseModel):
    """
    Platform / Tenant API Keys for system-to-system integrations.
    Belongs to a Tenant and can only be managed by Tenant Owners or Admins.
    """
    __tablename__ = "tenant_api_keys"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    key_prefix: Mapped[str] = mapped_column(String(16), index=True, nullable=False)
    hashed_key: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)

    scopes: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    created_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    last_used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_used_ip: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)

    reminder_30d_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    reminder_24h_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    tenant: Mapped["Tenant"] = relationship("Tenant", foreign_keys=[tenant_id])
    created_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[created_by_id])
