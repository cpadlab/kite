import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class AppCreateSchema(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    app_id: str = Field(..., min_length=3, max_length=64, pattern=r"^[a-zA-Z0-9_-]+$")
    user_ids: list[uuid.UUID] = Field(default_factory=list)


class AppUpdateSchema(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)


class AppReadSchema(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    app_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    user_ids: list[uuid.UUID] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class PaginatedAppResponseSchema(BaseModel):
    items: list[AppReadSchema]
    total: int
    page: int
    page_size: int
    total_pages: int


class AppAssignUsersSchema(BaseModel):
    user_ids: list[uuid.UUID] = Field(default_factory=list)
