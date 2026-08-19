import { api } from '../../client'

export interface ScopeItem {
    key: string
    name: string
    description: string
}

export interface ScopeCategoryItem {
    id: string
    name: string
    description: string
    scopes: ScopeItem[]
}

export interface SystemScopesResponse {
    scopes: ScopeCategoryItem[]
    valid_scopes: string[]
}

export const scopesService = {
    async getAvailableScopes(): Promise<{ scopes: string[]; registry: ScopeCategoryItem[] }> {
        try {
            const res = await api.get<SystemScopesResponse>('/scopes')
            return {
                scopes: res.valid_scopes || [],
                registry: res.scopes || [],
            }
        } catch {
            return {
                scopes: [
                    'telemetry:read',
                    'telemetry:write',
                    'analytics:export',
                    'api_keys:manage',
                    'users:read',
                    'users:write',
                ],
                registry: [],
            }
        }
    },
}
