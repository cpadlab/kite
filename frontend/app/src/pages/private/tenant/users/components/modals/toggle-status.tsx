import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircleIcon, Loader2Icon, XIcon, CheckIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { tenantUserService } from '@/lib/api/services/iam/tenant-user'
import type { TenantMemberItem } from '@/types/iam'

interface ToggleUserStatusModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    member: TenantMemberItem | null
    currentUser2FA: boolean
    onSuccess: () => void
}

export const ToggleUserStatusModal: React.FC<ToggleUserStatusModalProps> = ({
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

    const targetActiveState = !member.is_active

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setIsSubmitting(true)
            await tenantUserService.toggleUserStatus(member.id, {
                is_active: targetActiveState,
                totp_code: currentUser2FA ? totpCode.trim() : undefined,
            })

            toast.add({
                title: t('pages.private.tenant.users.modals.toggle_status.success_title'),
                description: 'User status updated successfully.',
                type: 'success',
            })

            setTotpCode('')
            onSuccess()
            onOpenChange(false)
        } catch (err: any) {
            console.error('Failed to toggle user status:', err)
            toast.add({
                title: t('pages.private.tenant.users.modals.toggle_status.error_title'),
                description: err.response?.data?.detail || 'An error occurred while changing user status.',
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
                        <div className="flex items-center gap-2">
                            <AlertCircleIcon className="size-4 text-warning" />
                            <DialogTitle>
                                {targetActiveState
                                    ? t('pages.private.tenant.users.modals.toggle_status.title_enable')
                                    : t('pages.private.tenant.users.modals.toggle_status.title_disable')}
                            </DialogTitle>
                        </div>
                        <DialogDescription>
                            {targetActiveState
                                ? t('pages.private.tenant.users.modals.toggle_status.description_enable', { name })
                                : t('pages.private.tenant.users.modals.toggle_status.description_disable', { name })}
                        </DialogDescription>
                    </DialogHeader>

                    {currentUser2FA && (
                        <div className="space-y-2 border rounded-lg p-3 bg-muted/50">
                            <Label htmlFor="totpCode-status" className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                                {t('pages.private.tenant.users.modals.toggle_status.totp_label')}
                            </Label>
                            <Input
                                id="totpCode-status"
                                value={totpCode}
                                onChange={(e) => setTotpCode(e.target.value)}
                                placeholder="000000"
                                maxLength={6}
                                className="text-center font-mono letter-spacing-widest"
                                disabled={isSubmitting}
                            />
                            <p className="text-[11px] text-muted-foreground mt-1">
                                {t('pages.private.tenant.users.modals.toggle_status.totp_hint')}
                            </p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            <XIcon className="size-4 mr-1" />
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant={targetActiveState ? 'default' : 'destructive'}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <Loader2Icon className="size-4 animate-spin mr-1" />
                            ) : (
                                <CheckIcon className="size-4 mr-1" />
                            )}
                            {targetActiveState
                                ? t('pages.private.tenant.users.modals.toggle_status.confirm_enable')
                                : t('pages.private.tenant.users.modals.toggle_status.confirm_disable')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
