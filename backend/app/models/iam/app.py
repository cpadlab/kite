import uuid
from typing import List, TYPE_CHECKING
from sqlalchemy import Boolean, Column, ForeignKey, String, Table
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.models import BaseModel
from app.database.postgres import Base

if TYPE_CHECKING:
    from app.models.iam.tenant import Tenant
    from app.models.iam.user import User

user_app_association = Table(
    "user_app_association",
    Base.metadata,
    Column(
        "user_id",
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "app_id",
        PG_UUID(as_uuid=True),
        ForeignKey("tenant_apps.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class TenantApp(BaseModel):
    __tablename__ = "tenant_apps"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    app_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    tenant: Mapped["Tenant"] = relationship("Tenant", foreign_keys=[tenant_id])

    users: Mapped[List["User"]] = relationship(
        "User",
        secondary=user_app_association,
        back_populates="apps",
    )
