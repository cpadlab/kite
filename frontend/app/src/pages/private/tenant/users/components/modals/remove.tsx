import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2Icon, Loader2Icon, XIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { tenantUserService } from '@/lib/api/services/iam/tenant-user'
import type { TenantMemberItem } from '@/types/iam'

interface RemoveUserModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    member: TenantMemberItem | null
    currentUser2FA: boolean
    onSuccess: () => void
}

export const RemoveUserModal: React.FC<RemoveUserModalProps> = ({
    open,
    onOpenChange,
    member,
    currentUser2FA,
    onSuccess,
}) => {
    const { t } = useTranslation()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [totpCode, setTotpCode] = useState('')

    if (!member) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setIsSubmitting(true)
            await tenantUserService.removeUser(member.id, {
                totp_code: currentUser2FA ? totpCode.trim() : undefined,
            })

            toast.add({
                title: t('pages.private.tenant.users.modals.remove.success_title'),
                description: 'User successfully removed from organization.',
                type: 'success',
            })

            setTotpCode('')
            onSuccess()
            onOpenChange(false)
        } catch (err: any) {
            console.error('Failed to remove user:', err)
            toast.add({
                title: t('pages.private.tenant.users.modals.remove.error_title'),
                description: err.response?.data?.detail || 'An error occurred while removing the user.',
                type: 'error',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const name = `${member.first_name} ${member.last_name}`

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-destructive">
                            <Trash2Icon className="size-4" />
                            <DialogTitle>{t('pages.private.tenant.users.modals.remove.title')}</DialogTitle>
                        </div>
                        <DialogDescription>
                            {t('pages.private.tenant.users.modals.remove.description', { name })}
                        </DialogDescription>
                    </DialogHeader>

                    {currentUser2FA && (
                        <div className="space-y-2 border rounded-lg p-3 bg-muted/50">
                            <Label htmlFor="totpCode-remove" className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                                {t('pages.private.tenant.users.modals.remove.totp_label')}
                            </Label>
                            <Input
                                id="totpCode-remove"
                                value={totpCode}
                                onChange={(e) => setTotpCode(e.target.value)}
                                placeholder="000000"
                                maxLength={6}
                                className="text-center font-mono letter-spacing-widest"
                                disabled={isSubmitting}
                            />
                            <p className="text-[11px] text-muted-foreground mt-1">
                                {t('pages.private.tenant.users.modals.remove.totp_hint')}
                            </p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            <XIcon className="size-4 mr-1" />
                            Cancel
                        </Button>
                        <Button type="submit" variant="destructive" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <Loader2Icon className="size-4 animate-spin mr-1" />
                            ) : (
                                <Trash2Icon className="size-4 mr-1" />
                            )}
                            {t('pages.private.tenant.users.modals.remove.confirm')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
