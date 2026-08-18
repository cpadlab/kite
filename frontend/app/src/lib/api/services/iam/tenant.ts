import { api } from '../../client'
import type {
    TenantCreatePayload,
    TenantCreateResponse,
    PaginatedTenantResponse,
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
}
