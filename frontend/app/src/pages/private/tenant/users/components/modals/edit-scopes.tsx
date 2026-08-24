import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldCheckIcon, Loader2Icon, XIcon, CheckIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from '@/components/ui/toast'
import { tenantUserService } from '@/lib/api/services/iam/tenant-user'
import { SYSTEM_SCOPES } from '@/lib/constants/scopes'
import type { TenantMemberItem } from '@/types/iam'

interface EditUserScopesModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    member: TenantMemberItem | null
    onSuccess: () => void
}

export const EditUserScopesModal: React.FC<EditUserScopesModalProps> = ({
    open,
    onOpenChange,
    member,
    onSuccess,
}) => {
    const { t } = useTranslation()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [scopes, setScopes] = useState<string[]>([])

    useEffect(() => {
        if (member) {
            setScopes(member.scopes || [])
        }
    }, [member])

    if (!member) return null

    const handleScopeChange = (scopeId: string, checked: boolean) => {
        if (checked) {
            setScopes((prev) => [...prev, scopeId])
        } else {
            setScopes((prev) => prev.filter((id) => id !== scopeId))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setIsSubmitting(true)
            await tenantUserService.updateUserScopes(member.id, { scopes })

            toast.add({
                title: t('pages.private.tenant.users.modals.edit_scopes.success_title'),
                description: 'User permissions (scopes) updated successfully.',
                type: 'success',
            })

            onSuccess()
            onOpenChange(false)
        } catch (err: any) {
            console.error('Failed to update user scopes:', err)
            toast.add({
                title: t('pages.private.tenant.users.modals.edit_scopes.error_title'),
                description: err.response?.data?.detail || 'An error occurred while updating the scopes.',
                type: 'error',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const name = `${member.first_name} ${member.last_name}`

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <ShieldCheckIcon className="size-4 text-primary" />
                            <DialogTitle>{t('pages.private.tenant.users.modals.edit_scopes.title')}</DialogTitle>
                        </div>
                        <DialogDescription>
                            {t('pages.private.tenant.users.modals.edit_scopes.description', { name })}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 border rounded-lg p-3 bg-muted/50 max-h-60 overflow-y-auto">
                        {SYSTEM_SCOPES.map((group) => (
                            <div key={group.key} className="space-y-2">
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    {t(group.labelKey)}
                                </div>
                                <div className="grid gap-2">
                                    {group.actions.map((action) => (
                                        <div key={action.id} className="flex items-start gap-2">
                                            <Checkbox
                                                id={`edit-scope-${action.id}`}
                                                checked={scopes.includes(action.id)}
                                                onCheckedChange={(checked: boolean) =>
                                                    handleScopeChange(action.id, checked)
                                                }
                                                disabled={isSubmitting}
                                            />
                                            <div className="grid gap-0.5 leading-none">
                                                <Label
                                                    htmlFor={`edit-scope-${action.id}`}
                                                    className="text-sm font-medium cursor-pointer"
                                                >
                                                    {t(action.labelKey)}
                                                </Label>
                                                {action.descriptionKey && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {t(action.descriptionKey)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
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
                            {t('pages.private.tenant.users.modals.edit_scopes.submit')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
