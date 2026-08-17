import { api, clearSession, setAccessToken } from '../client'

/**
 * Login Credentials Payload Schema.
 */
export interface LoginCredentials {
    /** Username or Email identifier */
    identifier: string
    /** Account password */
    password: string
    /** Optional 6-digit TOTP verification code or emergency backup code */
    totp_code?: string
}

/**
 * Token Response & Session Metadata Payload.
 */
export interface TokenResponse {
    /** Signed JWT Access Token (present if authentication complete) */
    access_token?: string
    /** Token type (default 'bearer') */
    token_type: string
    /** Token expiration datetime string in UTC */
    expires_at?: string
    /** Unique session UUID */
    session_id?: string
    /** Authenticated user UUID */
    user_id?: string
    /** Multi-tenant organization UUID context */
    tenant_id?: string
    /** Granted authorization scopes */
    scopes: string[]
    /** Flag indicating whether 2FA TOTP verification is required */
    requires_2fa: boolean
    /** Temporary pre-authentication JWT token for 2FA step */
    pre_auth_token?: string
}

/**
 * IAM Frontend API Service.
 * Provides hyper-secured identity, login, and session lifecycle methods.
 */
export const iamService = {
    /**
     * Authenticate user credentials with the backend.
     * Supports Email/Username, Argon2id verification, TOTP 2FA, and automatic memory token persistence.
     *
     * @param credentials - Login credentials object.
     * @returns Promise resolving to TokenResponse metadata.
     */
    async login(credentials: LoginCredentials): Promise<TokenResponse> {
        // Sanitize payload inputs before transmission
        const payload: LoginCredentials = {
            identifier: credentials.identifier.trim(),
            password: credentials.password,
            ...(credentials.totp_code ? { totp_code: credentials.totp_code.trim() } : {}),
        }

        const response = await api.post<TokenResponse>('/auth/login', payload)

        // Automatically store token in secure memory if primary auth succeeded
        if (response.access_token && !response.requires_2fa) {
            setAccessToken(response.access_token)
        }

        return response
    },

    /**
     * Terminate the local session safely from memory.
     */
    logout(): void {
        clearSession()
    },
}
