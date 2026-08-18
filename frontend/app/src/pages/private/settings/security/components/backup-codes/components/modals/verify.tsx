import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldCheckIcon, Loader2Icon, XIcon, EyeIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { totpService } from '@/lib/api/services/iam/totp'

interface VerifyBackupDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onVerified: (codes: string[]) => void
}

export const VerifyBackupDialog: React.FC<VerifyBackupDialogProps> = ({
    isOpen,
    onOpenChange,
    onVerified,
}) => {

    const { t } = useTranslation()

    const [verifyCode, setVerifyCode] = useState<string>('')
    const [isVerifying, setIsVerifying] = useState<boolean>(false)

    useEffect(() => {
        if (isOpen) {
            setVerifyCode('')
        }
    }, [isOpen])

    const handleConfirmVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        if (verifyCode.trim().length !== 6) return

        setIsVerifying(true)
        try {
            const res = await totpService.getBackupCodes(verifyCode)
            onVerified(res.backup_codes)
            onOpenChange(false)
        } catch (err: any) {
            const errorMsg = err?.message || t('pages.private.settings.security.totp.invalid_code')
            toast.add({
                title: t('pages.public.login.error_title'),
                description: errorMsg,
                type: 'error',
            })
        } finally {
            setIsVerifying(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <ShieldCheckIcon className="size-5 text-primary" />
                        {t('pages.private.settings.security.backup_codes.dialog_title')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('pages.private.settings.security.backup_codes.dialog_desc')}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleConfirmVerify} className="space-y-5">
                    
                    <div className="flex flex-col items-center gap-3">
                        <InputOTP maxLength={6} value={verifyCode} onChange={(val) => setVerifyCode(val)} disabled={isVerifying} >
                            <InputOTPGroup>
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                            </InputOTPGroup>
                            <InputOTPSeparator />
                            <InputOTPGroup>
                                <InputOTPSlot index={3} />
                                <InputOTPSlot index={4} />
                                <InputOTPSlot index={5} />
                            </InputOTPGroup>
                        </InputOTP>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isVerifying}>
                            <XIcon />
                            {t('pages.private.settings.security.totp.cancel')}
                        </Button>
                        <Button type="submit" disabled={verifyCode.length !== 6 || isVerifying}>
                            {isVerifying && <Loader2Icon className="size-4 animate-spin" />}
                            {isVerifying ? t('pages.private.settings.security.totp.verifying') : t('pages.private.settings.security.backup_codes.dialog_submit')}
                            {!isVerifying && <EyeIcon />}
                        </Button>
                    </DialogFooter>

                </form>

            </DialogContent>
        </Dialog>
    )
}
