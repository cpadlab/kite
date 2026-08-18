import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldAlertIcon, Loader2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'
import { toast } from '@/components/ui/toast'
import { totpService } from '@/lib/api/services/iam/totp'

interface Disable2FADialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export const Disable2FADialog: React.FC<Disable2FADialogProps> = ({ isOpen, onOpenChange, onSuccess }) => {
    
    const { t } = useTranslation()

    const [disableCode, setDisableCode] = useState<string>('')
    const [isDisabling, setIsDisabling] = useState<boolean>(false)
    const [disableError, setDisableError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            setDisableCode('')
            setDisableError(null)
        }
    }, [isOpen])

    const handleConfirmDisable = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!disableCode.trim()) return

        setIsDisabling(true)
        setDisableError(null)
        try {
            await totpService.disable2FA(disableCode)
            toast.add({
                title: t('pages.private.settings.security.totp.title'),
                description: t('pages.private.settings.security.totp.success_disabled'),
                type: 'success',
            })
            onSuccess()
            onOpenChange(false)
        } catch (err: any) {
            const errorMsg = err?.message || t('pages.private.settings.security.totp.invalid_code')
            setDisableError(errorMsg)
            toast.add({
                title: t('pages.public.login.error_title'),
                description: errorMsg,
                type: 'error',
            })
        } finally {
            setIsDisabling(false)
        }
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent className="sm:max-w-md">
                
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-lg text-destructive">
                        <ShieldAlertIcon className="size-5 text-destructive" />
                        {t('pages.private.settings.security.totp.disable_modal_title')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('pages.private.settings.security.totp.disable_modal_desc')}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <form onSubmit={handleConfirmDisable} className="space-y-4 py-2">
                    <div className="flex flex-col items-center gap-3">
                        <InputOTP maxLength={8} value={disableCode} onChange={(val) => setDisableCode(val)} disabled={isDisabling}>
                            <InputOTPGroup>
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                                <InputOTPSlot index={3} />
                            </InputOTPGroup>
                            <InputOTPSeparator />
                            <InputOTPGroup>
                                <InputOTPSlot index={4} />
                                <InputOTPSlot index={5} />
                                <InputOTPSlot index={6} />
                                <InputOTPSlot index={7} />
                            </InputOTPGroup>
                        </InputOTP>
                        <p className="text-xs text-muted-foreground text-center">{t('pages.private.settings.security.totp.disable_hint')}</p>
                    </div>
                </form>

                <AlertDialogFooter>
                    <AlertDialogCancel type="button" onClick={() => onOpenChange(false)} disabled={isDisabling}>
                        {t('pages.private.settings.security.totp.cancel')}
                    </AlertDialogCancel>
                    <AlertDialogAction type="submit" variant="destructive" disabled={!disableCode.trim() || isDisabling} className="gap-2">
                        {isDisabling && <Loader2Icon className="size-4 animate-spin" />}
                        {isDisabling ? t('pages.private.settings.security.totp.verifying') : t('pages.private.settings.security.totp.disable_submit')}
                    </AlertDialogAction>
                </AlertDialogFooter>

            </AlertDialogContent>
        </AlertDialog>
    )
}
