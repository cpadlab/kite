import { api } from '../../client'
import type {
    ApiKeyCreatePayload,
    ApiKeyCreatedResponse,
    PaginatedApiKeyResponse,
} from '@/types/iam'

export interface GetApiKeysParams {
    search?: string
    page?: number
    page_size?: number
    sort_order?: 'asc' | 'desc'
}

export const apiKeyService = {
    async getApiKeys(params?: GetApiKeysParams): Promise<PaginatedApiKeyResponse> {
        return await api.get<PaginatedApiKeyResponse>('/tenants/current/api-keys', {
            params,
        })
    },

    async createApiKey(payload: ApiKeyCreatePayload): Promise<ApiKeyCreatedResponse> {
        return await api.post<ApiKeyCreatedResponse>('/tenants/current/api-keys', payload)
    },

    async rotateApiKey(keyId: string): Promise<ApiKeyCreatedResponse> {
        return await api.post<ApiKeyCreatedResponse>(`/tenants/current/api-keys/${keyId}/rotate`)
    },

    async revokeApiKey(keyId: string): Promise<{ status: string; message: string }> {
        return await api.delete<{ status: string; message: string }>(`/tenants/current/api-keys/${keyId}`)
    },
}
