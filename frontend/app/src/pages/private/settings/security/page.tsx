import React, { useState, useEffect, useCallback } from 'react'
import { LockIcon, Settings2Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SettingsBreadcrumbData } from '../breadcrumb'
import { PageBreadcrumb } from '@/components/blocks/breadcrumb'
import { TOTPSection } from './components/topt/section'
import { BackupCodesSection } from './components/backup-codes/section'
import { loginService } from '@/lib/api/services/iam/login'

const SettingsSecurityPage = () => {
    
    const { t } = useTranslation()
    const [is2FAEnabled, setIs2FAEnabled] = useState<boolean | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(true)

    const fetchStatus = useCallback(async () => {
        try {
            setIsLoading(true)
            const profile = await loginService.getMe()
            setIs2FAEnabled(profile.is_2fa_enabled)
        } catch (err) {
            console.error('Failed to load 2FA status:', err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchStatus()
    }, [fetchStatus])

    return (
        <div className="space-y-6">
            
            <div className='space-y-4'>
                <PageBreadcrumb category={{ label: 'layout.settings', icon: Settings2Icon }} current={{ label: 'layout.security', icon: LockIcon }} items={SettingsBreadcrumbData} />
                <div className="space-y-1">
                    <h1 className="md:text-2xl text-xl font-semibold text-foreground">{t('pages.private.settings.security.title')}</h1>
                    <p className="text-sm text-muted-foreground">{t('pages.private.settings.security.subtitle')}</p>
                </div>
            </div>

            <section className="space-y-6">
                <TOTPSection is2FAEnabled={is2FAEnabled} isLoadingStatus={isLoading} onStatusChange={(enabled) => setIs2FAEnabled(enabled)} />
                <BackupCodesSection is2FAEnabled={Boolean(is2FAEnabled)} isLoadingStatus={isLoading} />
            </section>
            
        </div>
    )
}

export default SettingsSecurityPage