import { LockIcon, Settings2Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SettingsBreadcrumbData } from '../breadcrumb'
import { PageBreadcrumb } from '@/components/blocks/breadcrumb'
import { TOTPSection } from './components/topt/section'

const SettingsSecurityPage = () => {
    
    const { t } = useTranslation()

    return (
        <div className="space-y-4">
            
            <PageBreadcrumb category={{ label: 'layout.settings', icon: Settings2Icon }} current={{ label: 'layout.security', icon: LockIcon }} items={SettingsBreadcrumbData} />

            <div className="space-y-1">
                <h1 className="md:text-2xl text-xl font-semibold text-foreground">{t('pages.private.settings.security.title')}</h1>
                <p className="text-sm text-muted-foreground">{t('pages.private.settings.security.subtitle')}</p>
            </div>

            <section className="space-y-4">
                <TOTPSection />
            </section>
            
        </div>
    )
}

export default SettingsSecurityPage