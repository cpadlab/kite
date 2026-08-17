import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


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

    model_config = ConfigDict(
        from_attributes=True
    )
