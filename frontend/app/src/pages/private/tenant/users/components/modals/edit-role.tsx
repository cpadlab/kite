import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldAlertIcon, Loader2Icon, XIcon, CheckIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { tenantUserService } from '@/lib/api/services/iam/tenant-user'
import type { TenantMemberItem } from '@/types/iam'

interface EditUserRoleModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    member: TenantMemberItem | null
    onSuccess: () => void
}

export const EditUserRoleModal: React.FC<EditUserRoleModalProps> = ({
    open,
    onOpenChange,
    member,
    onSuccess,
}) => {
    const { t } = useTranslation()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [role, setRole] = useState<'admin' | 'analyst'>('analyst')

    useEffect(() => {
        if (member) {
            setRole((member.role as 'admin' | 'analyst') || 'analyst')
        }
    }, [member])

    if (!member) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setIsSubmitting(true)
            await tenantUserService.updateUserRole(member.id, { role })

            toast.add({
                title: t('pages.private.tenant.users.modals.edit_role.success_title'),
                description: 'User role updated successfully.',
                type: 'success',
            })

            onSuccess()
            onOpenChange(false)
        } catch (err: any) {
            console.error('Failed to update user role:', err)
            toast.add({
                title: t('pages.private.tenant.users.modals.edit_role.error_title'),
                description: err.response?.data?.detail || 'An error occurred while updating the role.',
                type: 'error',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <ShieldAlertIcon className="size-4 text-primary" />
                            <DialogTitle>{t('pages.private.tenant.users.modals.edit_role.title')}</DialogTitle>
                        </div>
                        <DialogDescription>
                            {t('pages.private.tenant.users.modals.edit_role.description')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <div className="text-sm font-medium">
                            User: <span className="font-semibold">{member.first_name} {member.last_name} (@{member.username})</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="edit-role">{t('pages.private.tenant.users.modals.invite.fields.role.label')}</Label>
                        <Select
                            value={role}
                            onValueChange={(val: 'admin' | 'analyst') => setRole(val)}
                            disabled={isSubmitting}
                        >
                            <SelectTrigger id="edit-role">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">{t('pages.private.tenant.users.roles.admin')}</SelectItem>
                                <SelectItem value="analyst">{t('pages.private.tenant.users.roles.analyst')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            <XIcon className="size-4 mr-1" />
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <Loader2Icon className="size-4 animate-spin mr-1" />
                            ) : (
                                <CheckIcon className="size-4 mr-1" />
                            )}
                            {t('pages.private.tenant.users.modals.edit_role.submit')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
