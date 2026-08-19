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
    tenant_name?: string
    role?: string
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

export type UserItem = UserProfileResponse

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

export interface TenantInvitationPublic {
    token: string
    email: string
    tenant_name: string
    first_name?: string
    last_name?: string
    username?: string
    status: string
    expires_at: string
    is_valid: boolean
}

export interface AcceptInvitationPayload {
    token: string
    password: string
    first_name?: string
    last_name?: string
    username?: string
}

export interface ApiKeyItem {
    id: string
    tenant_id: string
    name: string
    key_prefix: string
    scopes: string[]
    is_active: boolean
    created_at: string
    updated_at: string
    expires_at: string
    last_used_at?: string | null
    last_used_ip?: string | null
    created_by?: UserAuditInfo | null
}

export interface ApiKeyCreatePayload {
    name: string
    scopes: string[]
    expiration_days: number
}

export interface ApiKeyCreatedResponse {
    api_key: ApiKeyItem
    secret_key: string
    message: string
}

export interface PaginatedApiKeyResponse {
    items: ApiKeyItem[]
    total: number
    page: number
    page_size: number
    total_pages: number
}

export interface TenantMemberItem {
    id: string
    tenant_id?: string | null
    email: string
    first_name: string
    last_name: string
    username: string
    role?: 'owner' | 'admin' | 'analyst' | string | null
    scopes: string[]
    is_active: boolean
    is_2fa_enabled: boolean
    created_at: string
    last_login_at?: string | null
}

export interface PaginatedTenantMemberResponse {
    items: TenantMemberItem[]
    total: number
    page: number
    page_size: number
    total_pages: number
}

export interface TenantInvitationItem {
    id: string
    tenant_id: string
    email: string
    first_name?: string | null
    last_name?: string | null
    username?: string | null
    role: string
    scopes: string[]
    status: 'pending' | 'accepted' | 'revoked' | 'expired' | string
    expires_at: string
    created_at: string
    invited_by_name?: string | null
    invited_by_email?: string | null
}

export interface PaginatedTenantInvitationResponse {
    items: TenantInvitationItem[]
    total: number
    page: number
    page_size: number
    total_pages: number
}

export interface TenantUserInvitePayload {
    email: string
    first_name: string
    last_name: string
    username: string
    role: 'admin' | 'analyst'
    scopes: string[]
}

export interface TenantUserRoleUpdatePayload {
    role: 'admin' | 'analyst'
}

export interface TenantUserScopesUpdatePayload {
    scopes: string[]
}

export interface TenantUserStatusTogglePayload {
    is_active: boolean
    totp_code?: string
}

export interface TenantUserRemovePayload {
    totp_code?: string
}

export interface TenantOwnershipTransferPayload {
    target_user_id: string
    totp_code?: string
}
