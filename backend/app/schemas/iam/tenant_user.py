import uuid
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class TenantUserInviteSchema(BaseModel):
    email: EmailStr = Field(...)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    username: str = Field(..., min_length=3, max_length=50)
    role: Literal["admin", "analyst"] = Field(default="analyst")
    scopes: list[str] = Field(default_factory=list)


class TenantUserInviteResponseSchema(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    role: str
    scopes: list[str]
    status: str
    expires_at: datetime
    invitation_url: str
    message: str


class TenantInvitationDetailSchema(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    role: str
    scopes: list[str]
    status: str
    expires_at: datetime
    created_at: datetime
    invited_by_name: Optional[str] = None
    invited_by_email: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PaginatedTenantInvitationResponseSchema(BaseModel):
    items: list[TenantInvitationDetailSchema]
    total: int
    page: int
    page_size: int
    total_pages: int


class TenantMemberReadSchema(BaseModel):
    id: uuid.UUID
    tenant_id: Optional[uuid.UUID] = None
    email: str
    first_name: str
    last_name: str
    username: str
    role: Optional[str] = None
    scopes: list[str] = Field(default_factory=list)
    is_active: bool
    is_2fa_enabled: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PaginatedTenantMemberResponseSchema(BaseModel):
    items: list[TenantMemberReadSchema]
    total: int
    page: int
    page_size: int
    total_pages: int


class TenantUserRoleUpdateSchema(BaseModel):
    role: Literal["admin", "analyst"] = Field(...)

class TenantUserScopesUpdateSchema(BaseModel):
    scopes: list[str] = Field(...)


class TenantOwnershipTransferSchema(BaseModel):
    target_user_id: uuid.UUID = Field(...)
    totp_code: Optional[str] = Field(default=None, min_length=6, max_length=6)
