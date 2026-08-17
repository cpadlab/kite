import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class LoginCredentialsSchema(BaseModel):
    identifier: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    totp_code: str | None = Field(default=None, min_length=6, max_length=10)


class TokenResponseSchema(BaseModel):
    access_token: str | None = None
    token_type: str = "bearer"
    expires_at: datetime | None = None
    session_id: uuid.UUID | None = None
    user_id: uuid.UUID | None = None
    tenant_id: uuid.UUID | None = None
    scopes: list[str] = []
    requires_2fa: bool = False
    pre_auth_token: str | None = None


class TOTPSetupResponseSchema(BaseModel):
    totp_secret: str
    qr_code_uri: str
    backup_codes: list[str]


class Verify2FAPayloadSchema(BaseModel):
    code: str = Field(..., min_length=6, max_length=10)


class SessionReadSchema(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID | None = None
    token_jti: str
    ip_address: str | None = None
    user_agent: str | None = None
    device_type: str | None = None
    is_active: bool
    last_activity_at: datetime
    expires_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


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
    sessions: list[SessionReadSchema] = []

    model_config = ConfigDict(from_attributes=True)