import { Building2Icon, PencilRulerIcon } from 'lucide-react'
import { PlatformBreadcrumbData } from '../breadcrumb'
import { PageBreadcrumb } from '@/components/blocks/breadcrumb'

const PlatformTenantsPage = () => {

    return (
        <div className="space-y-6">
            
            <div className='space-y-4'>
                <PageBreadcrumb category={{ label: 'layout.platform', icon: PencilRulerIcon }} current={{ label: 'layout.tenants', icon: Building2Icon }} items={PlatformBreadcrumbData} />
            </div>

        </div>
    )
}

export default PlatformTenantsPage