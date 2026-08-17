import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class SessionReadSchema(BaseModel):
    id: uuid.UUID
    token_jti: str
    ip_address: str | None = None
    user_agent: str | None = None
    device_type: str | None = None
    is_active: bool
    last_activity_at: datetime
    expires_at: datetime
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class UserCreateSchema(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    is_superuser: bool = False


class UserReadSchema(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    username: str
    email: EmailStr
    is_active: bool
    is_superuser: bool
    is_email_verified: bool
    is_2fa_enabled: bool
    created_at: datetime
    updated_at: datetime
    first_login_at: datetime | None = None
    last_login_at: datetime | None = None
    failed_login_attempts: int
    login_locked_until: datetime | None = None
    invited_by_id: uuid.UUID | None = None
    sessions: list[SessionReadSchema] = []

    model_config = ConfigDict(
        from_attributes=True
    )