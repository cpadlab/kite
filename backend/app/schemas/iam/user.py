import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.iam.session import SessionReadSchema


class UserCreateSchema(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    is_superuser: bool = False
    tenant_id: uuid.UUID | None = None
    scopes: list[str] = []


class UserReadSchema(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID | None = None
    first_name: str
    last_name: str
    username: str
    email: EmailStr
    is_active: bool
    is_superuser: bool
    is_email_verified: bool
    is_2fa_enabled: bool
    scopes: list[str] = []
    created_at: datetime
    updated_at: datetime
    first_login_at: datetime | None = None
    last_login_at: datetime | None = None
    failed_login_attempts: int
    login_locked_until: datetime | None = None
    invited_by_id: uuid.UUID | None = None

    model_config = ConfigDict(
        from_attributes=True
    )
