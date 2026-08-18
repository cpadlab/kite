import { LockIcon, Settings2Icon } from 'lucide-react'
import { SettingsBreadcrumbData } from '../breadcrumb'
import { PageBreadcrumb } from '@/components/blocks/breadcrumb'

const SettingsSecurityPage = () => {
    return (
        <div>
            
            <PageBreadcrumb category={{ label: "layout.settings", icon: Settings2Icon }} current={{ label: "layout.security", icon: LockIcon }} items={SettingsBreadcrumbData} />

        </div>
    )
}

export default SettingsSecurityPage