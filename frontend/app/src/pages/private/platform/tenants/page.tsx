import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2Icon, PencilRulerIcon } from 'lucide-react'
import { PlatformBreadcrumbData } from '../breadcrumb'
import { PageBreadcrumb } from '@/components/blocks/breadcrumb'
import { CreateTenantModal } from './components/modals/create'
import { TenantsTable } from './components/table/table'
import { tenantService } from '@/lib/api/services/iam/tenant'
import { type TenantItem } from '@/types/iam'

const PlatformTenantsPage = () => {
    
    const { t } = useTranslation()

    const [tenants, setTenants] = useState<TenantItem[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(true)

    const [search, setSearch] = useState<string>('')
    const [page, setPage] = useState<number>(1)
    const [pageSize] = useState<number>(10)
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

    const [total, setTotal] = useState<number>(0)
    const [totalPages, setTotalPages] = useState<number>(1)

    const [isCreateOpen, setIsCreateOpen] = useState(false)

    const fetchTenants = useCallback(async () => {
        try {
            setIsLoading(true)
            const response = await tenantService.getTenants({
                search: search.trim() || undefined,
                page,
                page_size: pageSize,
                sort_order: sortOrder,
            })
            setTenants(response.items || [])
            setTotal(response.total || 0)
            setTotalPages(response.total_pages || 1)
        } catch (err) {
            console.error('Failed to fetch tenants:', err)
        } finally {
            setIsLoading(false)
        }
    }, [search, page, pageSize, sortOrder])

    useEffect(() => {
        fetchTenants()
    }, [fetchTenants])

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
                <PageBreadcrumb category={{ label: 'layout.platform', icon: PencilRulerIcon }} current={{ label: 'layout.tenants', icon: Building2Icon }} items={PlatformBreadcrumbData}/>
                <div className="space-y-1">
                    <h1 className="md:text-2xl text-xl font-semibold text-foreground">{t('pages.private.platform.tenants.title')}</h1>
                    <p className="text-sm text-muted-foreground">{t('pages.private.platform.tenants.subtitle')}</p>
                </div>
            </div>

            <TenantsTable data={tenants} isLoading={isLoading} total={total} page={page} pageSize={pageSize} totalPages={totalPages} search={search} onSearchChange={handleSearchChange} sortOrder={sortOrder} onSortOrderChange={handleSortOrderChange} onPageChange={setPage} onOpenCreate={() => setIsCreateOpen(true)}/>
            <CreateTenantModal isOpen={isCreateOpen} onOpenChange={setIsCreateOpen} onSuccess={fetchTenants} />

        </div>
    )
}

export default PlatformTenantsPage