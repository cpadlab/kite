import { api, clearSession, setAccessToken } from '../../client'
import type { LoginCredentials, TokenResponse, UserProfileResponse } from '../../../../types/iam'

export const loginService = {
    
    async login(credentials: LoginCredentials): Promise<TokenResponse> {

        const payload: LoginCredentials = {
            identifier: credentials.identifier.trim(),
            password: credentials.password,
            ...(credentials.totp_code ? { totp_code: credentials.totp_code.trim() } : {}),
        }

        const response = await api.post<TokenResponse>('/auth/login', payload)

        if (response.access_token && !response.requires_2fa) {
            setAccessToken(response.access_token)
        }

        return response
    },

    async getMe(): Promise<UserProfileResponse> {
        return await api.get<UserProfileResponse>('/auth/me')
    },

    logout(): void {
        clearSession()
    },
}
