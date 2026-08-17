from pydantic import BaseModel, Field


class TOTPSetupResponseSchema(BaseModel):
    totp_secret: str
    qr_code_uri: str
    backup_codes: list[str]


class Verify2FAPayloadSchema(BaseModel):
    code: str = Field(..., min_length=6, max_length=10)
