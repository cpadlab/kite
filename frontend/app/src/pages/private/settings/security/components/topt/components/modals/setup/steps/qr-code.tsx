import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG } from 'qrcode.react'
import { QrCodeIcon, CopyIcon, CheckIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface QRCodeStepProps {
    qrCodeUri: string
    totpSecret: string
}

export const QRCodeStep: React.FC<QRCodeStepProps> = ({ qrCodeUri, totpSecret }) => {
    const { t } = useTranslation()
    const [copiedSecret, setCopiedSecret] = useState<boolean>(false)

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopiedSecret(true)
        setTimeout(() => setCopiedSecret(false), 2000)
    }

    return (
        <div className="space-y-4">
            
            <div className="space-y-1">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <QrCodeIcon className="size-4 text-primary" />
                    {t('pages.private.settings.security.totp.setup_step1_title')}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    {t('pages.private.settings.security.totp.setup_step1_desc')}
                </p>
            </div>

            <div className="flex flex-col items-center gap-4">
                
                <div className="p-3 bg-white rounded-xl border shadow-xs flex items-center justify-center shrink-0">
                    <QRCodeSVG value={qrCodeUri} size={145} level="M" includeMargin={false} />
                </div>

                <div className="space-y-2 flex-1 w-full">
                    <Label className="text-xs">
                        {t('pages.private.settings.security.totp.secret_label')}
                    </Label>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-xs font-semibold text-foreground tracking-wider break-all border select-all">
                            {totpSecret}
                        </code>
                        <Button type="button" variant="outline" size="sm" onClick={() => copyToClipboard(totpSecret)} className="shrink-0 gap-1.5">
                            {copiedSecret ? (
                                <>
                                    <CheckIcon className="size-3.5 text-emerald-500" />
                                    <span>{t('pages.private.settings.security.totp.copied')}</span>
                                </>
                            ) : (
                                <>
                                    <CopyIcon className="size-3.5" />
                                    <span>{t('pages.private.settings.security.totp.copy_secret')}</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>

            </div>
            
        </div>
    )
}
