import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { totpService } from '@/lib/api/services/iam/totp'
import { loginService } from '@/lib/api/services/iam/login'
import type { TOTPSetupResponse } from '@/types/iam'

import { TOTPCard } from './components/card'
import { Setup2FADialog } from './components/modals/setup/dialog'
import { Disable2FADialog } from './components/modals/disable'

interface TOTPSectionProps {
    is2FAEnabled?: boolean | null
    isLoadingStatus?: boolean
    onStatusChange?: (enabled: boolean) => void
}

export const TOTPSection: React.FC<TOTPSectionProps> = ({
    is2FAEnabled: prop2FAEnabled,
    isLoadingStatus: propLoadingStatus,
    onStatusChange,
}) => {

    const { t } = useTranslation()

    const [internal2FAEnabled, setInternal2FAEnabled] = useState<boolean | null>(null)
    const [internalLoading, setInternalLoading] = useState<boolean>(true)
    const [isSetupOpen, setIsSetupOpen] = useState<boolean>(false)
    const [setupData, setSetupData] = useState<TOTPSetupResponse | null>(null)
    const [isSettingUp, setIsSettingUp] = useState<boolean>(false)
    const [isDisableOpen, setIsDisableOpen] = useState<boolean>(false)

    const is2FAEnabled = prop2FAEnabled !== undefined ? prop2FAEnabled : internal2FAEnabled
    const isLoadingStatus = propLoadingStatus !== undefined ? propLoadingStatus : internalLoading

    const fetchUser2FAStatus = useCallback(async () => {
        try {
            setInternalLoading(true)
            const profile = await loginService.getMe()
            setInternal2FAEnabled(profile.is_2fa_enabled)
            onStatusChange?.(profile.is_2fa_enabled)
        } catch (err) {
            console.error('Failed to fetch user 2FA status:', err)
        } finally {
            setInternalLoading(false)
        }
    }, [onStatusChange])

    useEffect(() => {
        if (prop2FAEnabled === undefined) {
            fetchUser2FAStatus()
        }
    }, [prop2FAEnabled, fetchUser2FAStatus])

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

    const handleEnableSuccess = () => {
        setInternal2FAEnabled(true)
        onStatusChange?.(true)
    }

    const handleDisableSuccess = () => {
        setInternal2FAEnabled(false)
        onStatusChange?.(false)
    }

    if (isLoadingStatus) {
        return null
    }

    return (
        <div className="space-y-4">
            <TOTPCard is2FAEnabled={Boolean(is2FAEnabled)} isSettingUp={isSettingUp} onStartSetup={handleStartSetup} onStartDisable={() => setIsDisableOpen(true)} />
            <Setup2FADialog isOpen={isSetupOpen} onOpenChange={setIsSetupOpen} setupData={setupData} onSuccess={handleEnableSuccess} />
            <Disable2FADialog isOpen={isDisableOpen} onOpenChange={setIsDisableOpen} onSuccess={handleDisableSuccess} />
        </div>
    )
}
