import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { totpService } from '@/lib/api/services/iam/totp'
import { loginService } from '@/lib/api/services/iam/login'
import type { TOTPSetupResponse } from '@/types/iam'

import { TOTPCard } from './components/card'
import { Setup2FADialog } from './components/modals/setup-dialog'
import { Disable2FADialog } from './components/modals/disable-dialog'

export const TOTPSection: React.FC = () => {
    
    const { t } = useTranslation()

    const [is2FAEnabled, setIs2FAEnabled] = useState<boolean | null>(null)
    const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true)
    const [isSetupOpen, setIsSetupOpen] = useState<boolean>(false)
    const [setupData, setSetupData] = useState<TOTPSetupResponse | null>(null)
    const [isSettingUp, setIsSettingUp] = useState<boolean>(false)
    const [isDisableOpen, setIsDisableOpen] = useState<boolean>(false)

    const fetchUser2FAStatus = useCallback(async () => {
        try {
            setIsLoadingStatus(true)
            const profile = await loginService.getMe()
            setIs2FAEnabled(profile.is_2fa_enabled)
        } catch (err) {
            console.error('Failed to fetch user 2FA status:', err)
        } finally {
            setIsLoadingStatus(false)
        }
    }, [])

    useEffect(() => {
        fetchUser2FAStatus()
    }, [fetchUser2FAStatus])

    const handleStartSetup = async () => {
        setIsSettingUp(true)
        try {
            const data = await totpService.setup2FA()
            setSetupData(data)
            setIsSetupOpen(true)
        } catch (err: any) {
            const msg = err?.message || t('pages.private.settings.security.totp.invalid_code')
            toast.add({
                title: t('pages.public.login.error_title'),
                description: msg,
                type: 'error',
            })
        } finally {
            setIsSettingUp(false)
        }
    }

    if (isLoadingStatus) {
        return (
            <div className="rounded-xl border bg-card p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-64" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                    <Skeleton className="h-9 w-28 rounded-md" />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <TOTPCard is2FAEnabled={Boolean(is2FAEnabled)} isSettingUp={isSettingUp} onStartSetup={handleStartSetup} onStartDisable={() => setIsDisableOpen(true)}/>
            <Setup2FADialog isOpen={isSetupOpen} onOpenChange={setIsSetupOpen} setupData={setupData} onSuccess={() => setIs2FAEnabled(true)}/>
            <Disable2FADialog isOpen={isDisableOpen} onOpenChange={setIsDisableOpen} onSuccess={() => setIs2FAEnabled(false)} />
        </div>
    )
}
