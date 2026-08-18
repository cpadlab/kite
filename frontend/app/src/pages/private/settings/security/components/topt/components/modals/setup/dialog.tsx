import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldCheckIcon, ArrowRightIcon, ArrowLeftIcon, Loader2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { totpService } from '@/lib/api/services/iam/totp'
import type { TOTPSetupResponse } from '@/types/iam'

import { QRCodeStep } from './steps/qr-code'
import { BackupCodesStep } from './steps/backup-codes'
import { VerificationStep } from './steps/verification'

interface Setup2FADialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    setupData: TOTPSetupResponse | null
    onSuccess: () => void
}

export const Setup2FADialog: React.FC<Setup2FADialogProps> = ({ isOpen, onOpenChange, setupData, onSuccess }) => {
    
    const { t } = useTranslation()

    const [currentStep, setCurrentStep] = useState<number>(1)
    const [enableCode, setEnableCode] = useState<string>('')
    const [isEnabling, setIsEnabling] = useState<boolean>(false)
    const [setupError, setSetupError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            setCurrentStep(1)
            setEnableCode('')
            setSetupError(null)
        }
    }, [isOpen])

    const handleConfirmEnable = async (e: React.FormEvent) => {
        e.preventDefault()
        if (enableCode.trim().length !== 6) return

        setIsEnabling(true)
        setSetupError(null)
        try {
            await totpService.enable2FA(enableCode)
            toast.add({
                title: t('pages.private.settings.security.totp.title'),
                description: t('pages.private.settings.security.totp.success_enabled'),
                type: 'success',
            })
            onSuccess()
            onOpenChange(false)
        } catch (err: any) {
            const errorMsg = err?.message || t('pages.private.settings.security.totp.invalid_code')
            setSetupError(errorMsg)
            toast.add({
                title: t('pages.public.login.error_title'),
                description: errorMsg,
                type: 'error',
            })
        } finally {
            setIsEnabling(false)
        }
    }

    const progressValue = Math.round((currentStep / 3) * 100)

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                
                <DialogHeader className="space-y-2">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <ShieldCheckIcon className="size-5 text-primary" />
                            {t('pages.private.settings.security.totp.setup_modal_title')}
                        </DialogTitle>
                    </div>
                    <DialogDescription>
                        {t('pages.private.settings.security.totp.description')}
                    </DialogDescription>
                </DialogHeader>

                <div className='flex items-center gap-1'>
                    <span className="text-xs font-semibold px-2 text-nowrap py-0.5 rounded-full bg-primary/10 text-primary">
                        {currentStep} / 3
                    </span>
                    <Progress value={progressValue} className="h-1.5" />
                </div>

                {setupData && (
                    <>
                    
                        <div>

                            {currentStep === 1 && (
                                <QRCodeStep qrCodeUri={setupData.qr_code_uri} totpSecret={setupData.totp_secret} />
                            )}

                            {currentStep === 2 && (
                                <BackupCodesStep backupCodes={setupData.backup_codes} />
                            )}

                            {currentStep === 3 && (
                                <VerificationStep code={enableCode} onChangeCode={setEnableCode} isEnabling={isEnabling} setupError={setupError} />
                            )}

                        </div>

                        <DialogFooter>

                            {currentStep === 1 && (
                                <>
                                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                        {t('pages.private.settings.security.totp.cancel')}
                                    </Button>
                                    <Button type="button" onClick={() => setCurrentStep(2)} className="gap-2">
                                        {t('pages.private.settings.security.totp.next')}
                                        <ArrowRightIcon className="size-4" />
                                    </Button>
                                </>
                            )}

                            {currentStep === 2 && (
                                <>
                                    <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} className="gap-2">
                                        <ArrowLeftIcon className="size-4" />
                                        {t('pages.private.settings.security.totp.back')}
                                    </Button>
                                    <Button type="button" onClick={() => setCurrentStep(3)} className="gap-2">
                                        {t('pages.private.settings.security.totp.next')}
                                        <ArrowRightIcon className="size-4" />
                                    </Button>
                                </>
                            )}

                            {currentStep === 3 && (
                                <>
                                    <Button type="button" variant="outline" onClick={() => setCurrentStep(2)} disabled={isEnabling} className="gap-2">
                                        <ArrowLeftIcon className="size-4" />
                                        {t('pages.private.settings.security.totp.back')}
                                    </Button>
                                    <Button type="button" onClick={handleConfirmEnable} disabled={enableCode.length !== 6 || isEnabling} className="gap-2">
                                        {isEnabling && <Loader2Icon className="size-4 animate-spin" />}
                                        {isEnabling ? t('pages.private.settings.security.totp.verifying') : t('pages.private.settings.security.totp.enable_submit')}
                                    </Button>
                                </>
                            )}

                        </DialogFooter>
                        
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
