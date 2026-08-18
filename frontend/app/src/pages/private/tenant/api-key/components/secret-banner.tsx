import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangleIcon, CopyIcon, CheckIcon, XIcon } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

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
        <Alert className="relative bg-amber-500/10 text-amber-900 dark:text-amber-200 border-amber-500/30 p-4 rounded-xl shadow-xs space-y-2">
            
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-sm">
                    <AlertTriangleIcon className="size-4 shrink-0" />
                    <span>{t('pages.private.tenant.api_keys.modals.secret_dialog.title')}</span>
                </div>
                <Button variant="ghost" size="icon-xs" onClick={onClose}>
                    <XIcon className="size-4" />
                </Button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
                {t('pages.private.tenant.api_keys.modals.secret_dialog.warning_desc')}
            </p>

            <div className="flex items-center gap-2 p-2.5 rounded-lg border bg-zinc-950 font-mono text-xs text-emerald-400 break-all select-all">
                <span className="flex-1">{secretKey}</span>
                <Button type="button" size="sm" variant="secondary" onClick={handleCopySecretKey}>
                    {isCopied ? <CheckIcon className="size-3.5 text-emerald-500" /> : <CopyIcon className="size-3.5" />}
                    <span>{isCopied ? t('common.copied') : t('common.copy')}</span>
                </Button>
            </div>
            
        </Alert>
    )
}
