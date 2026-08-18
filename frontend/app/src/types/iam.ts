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

export interface TenantCreatePayload {
    name: string
    max_users: number
    storage_quota_gb: number
    owner_email: string
    owner_first_name: string
    owner_last_name: string
    owner_username: string
}

export interface UserAuditInfo {
    id: string
    first_name: string
    last_name: string
    username: string
    email: string
}

export interface TenantItem {
    id: string
    name: string
    slug?: string
    max_users: number
    storage_quota_gb: number
    storage_used_bytes: number
    is_active: boolean
    created_at: string
    updated_at?: string
    owner_name?: string
    owner_email?: string
    owner_status?: string
    created_by?: UserAuditInfo
    updated_by?: UserAuditInfo
}

export interface PaginatedTenantResponse {
    items: TenantItem[]
    total: number
    page: number
    page_size: number
    total_pages: number
}

export interface TenantCreateResponse {
    tenant: TenantItem
    invitation_token: string
    registration_url: string
    expires_at: string
    message: string
}
