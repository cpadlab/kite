import { api } from '../../client'
import type {
    TenantCreatePayload,
    TenantCreateResponse,
    PaginatedTenantResponse,
    TenantInvitationPublic,
    AcceptInvitationPayload,
} from '../../../../types/iam'

export const tenantService = {
    async createTenant(payload: TenantCreatePayload): Promise<TenantCreateResponse> {
        return await api.post<TenantCreateResponse>('/tenants', payload)
    },

    async getTenants(params?: {
        search?: string
        page?: number
        page_size?: number
        sort_order?: 'asc' | 'desc'
    }): Promise<PaginatedTenantResponse> {
        return await api.get<PaginatedTenantResponse>('/tenants', { params })
    },

    async validateInvitationToken(token: string): Promise<TenantInvitationPublic> {
        return await api.get<TenantInvitationPublic>(`/tenants/invitations/${token}`)
    },

    async acceptInvitation(payload: AcceptInvitationPayload): Promise<{ status: string; message: string }> {
        return await api.post<{ status: string; message: string }>('/tenants/invitations/accept', payload)
    },
}
