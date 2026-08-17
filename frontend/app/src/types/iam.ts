
export interface LoginCredentials {
    identifier: string
    password: string
    totp_code?: string
}

export interface TokenResponse {
    access_token?: string
    token_type: string
    expires_at?: string
    session_id?: string
    user_id?: string
    tenant_id?: string
    scopes: string[]
    requires_2fa: boolean
    pre_auth_token?: string
}


export interface TOTPSetupResponse {
    totp_secret: string
    qr_code_uri: string
    backup_codes: string[]
}

export interface Verify2FAPayload {
    code: string
}

export interface UserProfileResponse {
    id: string
    tenant_id?: string
    first_name: string
    last_name: string
    username: string
    email: string
    is_active: boolean
    is_superuser: boolean
    is_email_verified: boolean
    is_2fa_enabled: boolean
    scopes: string[]
}
