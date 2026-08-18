import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.iam.tenant import UserAuditInfoSchema


class ApiKeyCreateSchema(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    scopes: list[str] = Field(default_factory=list)
    expiration_days: int = Field(default=365, ge=1, le=365)


class ApiKeyReadSchema(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    key_prefix: str
    scopes: list[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    expires_at: datetime
    last_used_at: datetime | None = None
    last_used_ip: str | None = None
    created_by: UserAuditInfoSchema | None = None

    model_config = ConfigDict(from_attributes=True)


class ApiKeyCreatedResponseSchema(BaseModel):
    api_key: ApiKeyReadSchema
    secret_key: str
    message: str


class PaginatedApiKeyResponseSchema(BaseModel):
    items: list[ApiKeyReadSchema]
    total: int
    page: int
    page_size: int
    total_pages: int
