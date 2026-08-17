import uuid
from datetime import datetime
from pydantic import BaseModel, Field


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
