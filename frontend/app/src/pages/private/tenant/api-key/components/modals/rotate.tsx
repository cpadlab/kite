import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCwIcon, AlertTriangleIcon, Loader2Icon, XIcon, RefreshCcwIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from '@/components/ui/toast'
import { apiKeyService } from '@/lib/api/services/iam/api-key'
import type { ApiKeyItem } from '@/types/iam'

interface RotateApiKeyModalProps {
    item: ApiKeyItem | null
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    onKeyGenerated: (secretKey: string) => void
}

export const RotateApiKeyModal: React.FC<RotateApiKeyModalProps> = ({
    item,
    isOpen,
    onOpenChange,
    onSuccess,
    onKeyGenerated,
}) => {

    const { t } = useTranslation()
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!item) return null

    const handleRotate = async () => {
        try {
            setIsSubmitting(true)
            const response = await apiKeyService.rotateApiKey(item.id)

            toast.add({
                title: t('pages.private.tenant.api_keys.modals.rotate.success_title'),
                description: response.message,
                type: 'success',
            })

            onSuccess()
            onOpenChange(false)
            onKeyGenerated(response.secret_key)
        } catch (err: any) {
            console.error('Failed to rotate API key:', err)
            toast.add({
                title: t('pages.private.tenant.api_keys.modals.rotate.error_title'),
                description: err.response?.data?.detail || t('pages.private.tenant.api_keys.modals.rotate.error_desc'),
                type: 'error',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <RefreshCwIcon className="size-4" />
                        <DialogTitle>{t('pages.private.tenant.api_keys.modals.rotate.title')}</DialogTitle>
                    </div>
                    <DialogDescription>
                        {t('pages.private.tenant.api_keys.modals.rotate.description', { name: item.name })}
                    </DialogDescription>
                </DialogHeader>

                <Alert variant="destructive" className='bg-destructive/5 border-destructive/50'>
                    <AlertTriangleIcon className="size-4" />
                    <AlertTitle>{t('pages.private.tenant.api_keys.modals.rotate.warning_title')}</AlertTitle>
                    <AlertDescription className="text-xs">
                        {t('pages.private.tenant.api_keys.modals.rotate.warning_desc')}
                    </AlertDescription>
                </Alert>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        <XIcon />
                        {t('pages.private.tenant.api_keys.cancel')}
                    </Button>
                    <Button variant="destructive" onClick={handleRotate} disabled={isSubmitting}>
                        {isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
                        {t('pages.private.tenant.api_keys.modals.rotate.confirm')}
                        {!isSubmitting && <RefreshCcwIcon />}
                    </Button>
                </DialogFooter>
                
            </DialogContent>
        </Dialog>
    )
}
