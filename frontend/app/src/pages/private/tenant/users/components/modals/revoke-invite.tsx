import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircleIcon, Loader2Icon, XIcon, CheckIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { tenantUserService } from '@/lib/api/services/iam/tenant-user'
import type { TenantInvitationItem } from '@/types/iam'

interface RevokeInviteModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    invitation: TenantInvitationItem | null
    onSuccess: () => void
}

export const RevokeInviteModal: React.FC<RevokeInviteModalProps> = ({
    open,
    onOpenChange,
    invitation,
    onSuccess,
}) => {
    const { t } = useTranslation()
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!invitation) return null

    const handleRevoke = async () => {
        try {
            setIsSubmitting(true)
            await tenantUserService.cancelInvitation(invitation.id)

            toast.add({
                title: t('pages.private.tenant.users.modals.revoke_invite.success_title'),
                description: 'Invitation successfully revoked.',
                type: 'success',
            })

            onSuccess()
            onOpenChange(false)
        } catch (err: any) {
            console.error('Failed to revoke invitation:', err)
            toast.add({
                title: t('pages.private.tenant.users.modals.revoke_invite.error_title'),
                description: err.response?.data?.detail || 'An error occurred while revoking the invitation.',
                type: 'error',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-destructive">
                        <AlertCircleIcon className="size-4" />
                        <DialogTitle>{t('pages.private.tenant.users.modals.revoke_invite.title')}</DialogTitle>
                    </div>
                    <DialogDescription>
                        {t('pages.private.tenant.users.modals.revoke_invite.description', { email: invitation.email })}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        <XIcon className="size-4 mr-1" />
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleRevoke}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <Loader2Icon className="size-4 animate-spin mr-1" />
                        ) : (
                            <CheckIcon className="size-4 mr-1" />
                        )}
                        {t('pages.private.tenant.users.modals.revoke_invite.confirm')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
