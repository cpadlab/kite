import { api } from '../../client'
import type { TOTPSetupResponse, Verify2FAPayload } from '../../../../types/iam'

export const totpService = {
    
    async setup2FA(): Promise<TOTPSetupResponse> {
        return api.post<TOTPSetupResponse>('/auth/2fa/setup')
    },

    async enable2FA(code: string): Promise<{ status: string; message: string }> {
        const payload: Verify2FAPayload = {
            code: code.trim(),
        }
        return api.post<{ status: string; message: string }>('/auth/2fa/enable', payload)
    },

    async disable2FA(code: string): Promise<{ status: string; message: string }> {
        const payload: Verify2FAPayload = {
            code: code.trim(),
        }
        return api.post<{ status: string; message: string }>('/auth/2fa/disable', payload)
    },
}
