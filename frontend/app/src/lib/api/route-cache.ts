import { tenantService } from './services/iam/tenant'
import { loginService } from './services/iam/login'

const cache = new Map<string, { data: unknown; timestamp: number }>()

const CACHE_TTL = 15000

export const routeCache = {
    set(key: string, data: unknown) {
        cache.set(key, { data, timestamp: Date.now() })
    },

    get<T>(key: string): T | null {
        const item = cache.get(key)
        if (!item) return null
        if (Date.now() - item.timestamp > CACHE_TTL) {
            cache.delete(key)
            return null
        }
        return item.data as T
    },

    clear(key?: string) {
        if (key) cache.delete(key)
        else cache.clear()
    },
}

export const routePreloaders: Record<string, () => Promise<unknown>> = {
    '/platform/tenants': async () => {
        const data = await tenantService.getTenants({ page: 1, page_size: 10, sort_order: 'desc' })
        routeCache.set('/platform/tenants', data)
        return data
    },
    '/settings/security': async () => {
        const data = await loginService.getMe()
        routeCache.set('/settings/security', data)
        return data
    },
}
