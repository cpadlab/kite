import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Building2Icon, PencilRulerIcon, PlusIcon } from 'lucide-react'
import { PlatformBreadcrumbData } from '../breadcrumb'
import { PageBreadcrumb } from '@/components/blocks/breadcrumb'
import { Button } from '@/components/ui/button'
import { CreateTenantModal } from './components/modals/create'

const PlatformTenantsPage = () => {
    const { t } = useTranslation()
    const [isCreateOpen, setIsCreateOpen] = useState(false)

    const handleTenantCreated = () => {
        // Refetch tenants list when table is implemented
    }

    return (
        <div className="space-y-6">
            
            <div className="space-y-4">
                <PageBreadcrumb category={{ label: 'layout.platform', icon: PencilRulerIcon }} current={{ label: 'layout.tenants', icon: Building2Icon }} items={PlatformBreadcrumbData} />
                <div className="space-y-1">
                    <h1 className="md:text-2xl text-xl font-semibold text-foreground">{t('pages.private.platform.tenants.title')}</h1>
                    <p className="text-sm text-muted-foreground">{t('pages.private.platform.tenants.subtitle')}</p>
                </div>
            </div>

            <div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <PlusIcon className="size-4" />
                    <span>{t('pages.private.platform.tenants.create_button')}</span>
                </Button>
            </div>
            
            <CreateTenantModal isOpen={isCreateOpen} onOpenChange={setIsCreateOpen} onSuccess={handleTenantCreated} />

        </div>
    )
}

export default PlatformTenantsPage