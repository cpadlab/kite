import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangleIcon, CopyIcon, CheckIcon, XIcon } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { Label } from '@/components/ui/label'

interface SecretKeyBannerProps {
    secretKey: string | null
    onClose: () => void
}

export const SecretKeyBanner: React.FC<SecretKeyBannerProps> = ({ secretKey, onClose }) => {

    const { t } = useTranslation()
    const [isCopied, setIsCopied] = useState(false)

    if (!secretKey) return null

    const handleCopySecretKey = () => {
        navigator.clipboard.writeText(secretKey)
        setIsCopied(true)
        toast.add({
            title: t('pages.private.tenant.api_keys.modals.secret_dialog.copied_toast'),
            type: 'info',
        })
        setTimeout(() => setIsCopied(false), 2000)
    }

    return (
        <Alert className="relative bg-muted/50 p-4 rounded-xl">
            
            <div className="flex items-center justify-between gap-2">
                <Label>{t('pages.private.tenant.api_keys.modals.secret_dialog.title')}</Label>
                <Button variant="ghost" size="icon-xs" onClick={onClose}>
                    <XIcon className="size-4" />
                </Button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
                {t('pages.private.tenant.api_keys.modals.secret_dialog.warning_desc')}
            </p>

            <div className="flex items-center gap-2 p-2.5 rounded-lg border bg-card font-mono text-xs text-muted-foreground break-all select-all mt-2">
                <span className="flex-1">{secretKey}</span>
                <Button type="button" size="sm" variant="secondary" onClick={handleCopySecretKey}>
                    {isCopied ? <CheckIcon className="size-3.5 text-emerald-500" /> : <CopyIcon className="size-3.5" />}
                    <span>{isCopied ? t('pages.private.tenant.api_keys.copied') : t('pages.private.tenant.api_keys.copy')}</span>
                </Button>
            </div>

        </Alert>
    )
}
