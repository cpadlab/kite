import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldAlertIcon, Loader2Icon, ChevronRightIcon, XIcon, RectangleEllipsisIcon, FingerprintPatternIcon } from 'lucide-react'

import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from '@/components/ui/toast'
import { totpService } from '@/lib/api/services/iam/totp'

interface Disable2FADialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export const Disable2FADialog: React.FC<Disable2FADialogProps> = ({
    isOpen,
    onOpenChange,
    onSuccess,
}) => {
    const { t } = useTranslation()

    const [activeTab, setActiveTab] = useState<'totp' | 'backup'>('totp')
    const [disableCode, setDisableCode] = useState<string>('')
    const [isDisabling, setIsDisabling] = useState<boolean>(false)

    useEffect(() => {
        if (isOpen) {
            setActiveTab('totp')
            setDisableCode('')
        }
    }, [isOpen])

    const handleConfirmDisable = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!disableCode.trim()) return

        setIsDisabling(true)
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
            toast.add({
                title: t('pages.public.login.error_title'),
                description: errorMsg,
                type: 'error',
            })
        } finally {
            setIsDisabling(false)
        }
    }

    const isSubmitDisabled =
        isDisabling ||
        (activeTab === 'totp' ? disableCode.trim().length !== 6 : disableCode.trim().length !== 8)

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

                <form onSubmit={handleConfirmDisable} className="space-y-4">
                    <Tabs value={activeTab} onValueChange={(val) => {setActiveTab(val as 'totp' | 'backup');setDisableCode('') }} className="w-full flex flex-col items-center">
                        
                        <TabsList className="w-full grid grid-cols-2">
                            <TabsTrigger value="totp">
                                <FingerprintPatternIcon />
                                {t('pages.private.settings.security.totp.tab_totp')}
                            </TabsTrigger>
                            <TabsTrigger value="backup">
                                <RectangleEllipsisIcon />
                                {t('pages.private.settings.security.totp.tab_backup')}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="totp" className="w-full flex flex-col items-center gap-3 pt-3">
                            <InputOTP maxLength={6} value={activeTab === 'totp' ? disableCode : ''} onChange={(val) => setDisableCode(val)} disabled={isDisabling}>
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
                            <p className="text-xs text-muted-foreground text-center">{t('pages.private.settings.security.totp.totp_hint')}</p>
                        </TabsContent>

                        <TabsContent value="backup" className="w-full flex flex-col items-center gap-3 pt-3">
                            <InputOTP maxLength={8} value={activeTab === 'backup' ? disableCode : ''} onChange={(val) => setDisableCode(val)} disabled={isDisabling}>
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
                            <p className="text-xs text-muted-foreground text-center">{t('pages.private.settings.security.totp.backup_hint')}</p>
                        </TabsContent>

                    </Tabs>

                    <AlertDialogFooter>
                        <AlertDialogCancel type="button" onClick={() => onOpenChange(false)} disabled={isDisabling}>
                            <XIcon />
                            {t('pages.private.settings.security.totp.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction type="submit" variant="destructive" disabled={isSubmitDisabled} onClick={handleConfirmDisable}>
                            {isDisabling && <Loader2Icon className="size-4 animate-spin" />}
                            {isDisabling ? t('pages.private.settings.security.totp.verifying') : t('pages.private.settings.security.totp.disable_submit')}
                            {!isDisabling && <ChevronRightIcon />}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                    
                </form>

            </AlertDialogContent>
        </AlertDialog>
    )
}
