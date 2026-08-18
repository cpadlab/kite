import React from 'react'
import { useTranslation } from 'react-i18next'
import { FileTextIcon } from 'lucide-react'
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp'

interface VerificationStepProps {
    code: string
    onChangeCode: (code: string) => void
    isEnabling: boolean
    setupError: string | null
}

export const VerificationStep: React.FC<VerificationStepProps> = ({
    code,
    onChangeCode,
    isEnabling,
    setupError,
}) => {
    const { t } = useTranslation()

    return (
        <div className="space-y-4">
            
            <div className="space-y-1">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <FileTextIcon className="size-4 text-primary" />
                    {t('pages.private.settings.security.totp.setup_step3_title')}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    {t('pages.private.settings.security.totp.setup_step3_desc')}
                </p>
            </div>

            <div className="flex flex-col items-center justify-center gap-3 pt-2">
                <InputOTP maxLength={6} value={code} onChange={onChangeCode} disabled={isEnabling}>
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
            
        </div>
    )
}
