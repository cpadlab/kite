import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2Icon, Loader2Icon, XIcon } from 'lucide-react'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { apiKeyService } from '@/lib/api/services/iam/api-key'
import type { ApiKeyItem } from '@/types/iam'

interface DeleteApiKeyModalProps {
    item: ApiKeyItem | null
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export const DeleteApiKeyModal: React.FC<DeleteApiKeyModalProps> = ({
    item,
    isOpen,
    onOpenChange,
    onSuccess,
}) => {

    const { t } = useTranslation()
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!item) return null

    const handleDelete = async () => {
        try {
            setIsSubmitting(true)
            const res = await apiKeyService.revokeApiKey(item.id)
            toast.add({
                title: t('pages.private.tenant.api_keys.modals.delete.success_title'),
                description: res.message,
                type: 'success',
            })
            onSuccess()
            onOpenChange(false)
        } catch (err: any) {
            console.error('Failed to revoke API key:', err)
            toast.add({
                title: t('pages.private.tenant.api_keys.modals.delete.error_title'),
                description: err.response?.data?.detail || t('pages.private.tenant.api_keys.modals.delete.error_desc'),
                type: 'error',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent className="sm:max-w-md">
                
                <AlertDialogHeader>
                    <div className="flex items-center gap-2 text-destructive">
                        <Trash2Icon className="size-4" />
                        <AlertDialogTitle>{t('pages.private.tenant.api_keys.modals.delete.title')}</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription>
                        {t('pages.private.tenant.api_keys.modals.delete.description', { name: item.name })}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        <XIcon />
                        {t('pages.private.tenant.api_keys.cancel')}
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                        {isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
                        {t('pages.private.tenant.api_keys.modals.delete.confirm')}
                        {!isSubmitting && <Trash2Icon />}
                    </Button>
                </AlertDialogFooter>

            </AlertDialogContent>
        </AlertDialog>
    )
}
