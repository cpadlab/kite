import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class TenantCreateSchema(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    max_users: int = Field(default=5, ge=1)
    storage_quota_gb: int = Field(default=10, ge=1)
    
    owner_email: EmailStr = Field(...)
    owner_first_name: str = Field(..., min_length=1, max_length=100)
    owner_last_name: str = Field(..., min_length=1, max_length=100)
    owner_username: str = Field(..., min_length=3, max_length=50)


class UserAuditInfoSchema(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    username: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class TenantReadSchema(BaseModel):
    id: uuid.UUID
    name: str
    slug: Optional[str] = None
    max_users: int
    storage_quota_gb: int
    storage_used_bytes: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    owner_name: Optional[str] = None
    owner_email: Optional[str] = None
    owner_status: Optional[str] = None

    created_by: Optional[UserAuditInfoSchema] = None
    updated_by: Optional[UserAuditInfoSchema] = None

    model_config = ConfigDict(from_attributes=True)


class PaginatedTenantResponseSchema(BaseModel):
    """
    """
    items: list[TenantReadSchema]
    total: int
    page: int
    page_size: int
    total_pages: int


class TenantInvitationReadSchema(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    tenant_name: str
    email: str
    token: str
    role: str
    status: str
    expires_at: datetime
    accepted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TenantInvitationPublicSchema(BaseModel):
    token: str
    email: str
    tenant_name: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    status: str
    expires_at: datetime
    is_valid: bool


class AcceptInvitationSchema(BaseModel):
    token: str = Field(...)
    password: str = Field(..., min_length=8, max_length=128)
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    username: Optional[str] = Field(None, max_length=50)
