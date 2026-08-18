import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyRoundIcon, Building2Icon } from 'lucide-react'
import { PageBreadcrumb } from '@/components/blocks/breadcrumb'
import { ApiKeysTable } from './components/table/table'
import { SecretKeyBanner } from './components/secret-banner'
import { CreateApiKeyModal } from './components/modals/create'
import { RotateApiKeyModal } from './components/modals/rotate'
import { DeleteApiKeyModal } from './components/modals/delete'
import { apiKeyService } from '@/lib/api/services/iam/api-key'
import type { ApiKeyItem, PaginatedApiKeyResponse } from '@/types/iam'
import { routeCache } from '@/lib/api/route-cache'
import { TenantsBreadcrumbData } from '../breadcrumb'

const TenantApiKeysPage = () => {
    
    const { t } = useTranslation()

    const [keys, setKeys] = useState<ApiKeyItem[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(true)

    const [search, setSearch] = useState<string>('')
    const [page, setPage] = useState<number>(1)
    const [pageSize] = useState<number>(10)
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

    const [total, setTotal] = useState<number>(0)
    const [totalPages, setTotalPages] = useState<number>(1)

    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [rotateItem, setRotateItem] = useState<ApiKeyItem | null>(null)
    const [deleteItem, setDeleteItem] = useState<ApiKeyItem | null>(null)

    const [createdSecretKey, setCreatedSecretKey] = useState<string | null>(null)

    const fetchApiKeys = useCallback(async () => {
        const cached = routeCache.get<PaginatedApiKeyResponse>('/tenant/api-keys')
        if (cached && page === 1 && !search.trim() && sortOrder === 'desc') {
            setKeys(cached.items || [])
            setTotal(cached.total || 0)
            setTotalPages(cached.total_pages || 1)
            setIsLoading(false)
            routeCache.clear('/tenant/api-keys')
            return
        }

        try {
            setIsLoading(true)
            const response = await apiKeyService.getApiKeys({
                search: search.trim() || undefined,
                page,
                page_size: pageSize,
                sort_order: sortOrder,
            })
            setKeys(response.items || [])
            setTotal(response.total || 0)
            setTotalPages(response.total_pages || 1)
        } catch (err) {
            console.error('Failed to fetch platform API keys:', err)
        } finally {
            setIsLoading(false)
        }
    }, [search, page, pageSize, sortOrder])

    useEffect(() => {
        fetchApiKeys()
    }, [fetchApiKeys])

    const handleSearchChange = (val: string) => {
        setSearch(val)
        setPage(1)
    }

    const handleSortOrderChange = (order: 'asc' | 'desc') => {
        setSortOrder(order)
        setPage(1)
    }

    return (
        <div className="space-y-4">

            <div className="space-y-4">
                <PageBreadcrumb category={{ label: 'layout.tenant', icon: Building2Icon }} current={{ label: 'layout.api_keys', icon: KeyRoundIcon }} items={TenantsBreadcrumbData} />
                <div className="space-y-1">
                    <h1 className="md:text-2xl text-xl font-semibold text-foreground">{t('pages.private.tenant.api_keys.title')}</h1>
                    <p className="text-sm text-muted-foreground">{t('pages.private.tenant.api_keys.subtitle')}</p>
                </div>
            </div>

            <SecretKeyBanner secretKey={createdSecretKey} onClose={() => setCreatedSecretKey(null)} />

            <ApiKeysTable data={keys} isLoading={isLoading} total={total} page={page} pageSize={pageSize} totalPages={totalPages} search={search} onSearchChange={handleSearchChange} sortOrder={sortOrder} onSortOrderChange={handleSortOrderChange} onPageChange={setPage} onOpenCreate={() => setIsCreateOpen(true)} onOpenRotate={(item) => setRotateItem(item)} onOpenDelete={(item) => setDeleteItem(item)} />

            <CreateApiKeyModal isOpen={isCreateOpen} onOpenChange={setIsCreateOpen} onSuccess={fetchApiKeys} onKeyGenerated={(key) => setCreatedSecretKey(key)} />
            <RotateApiKeyModal item={rotateItem} isOpen={Boolean(rotateItem)} onOpenChange={(open) => !open && setRotateItem(null)} onSuccess={fetchApiKeys} onKeyGenerated={(key) => setCreatedSecretKey(key)} />
            <DeleteApiKeyModal item={deleteItem} isOpen={Boolean(deleteItem)} onOpenChange={(open) => !open && setDeleteItem(null)} onSuccess={fetchApiKeys} />

        </div>
    )
}

export default TenantApiKeysPage