import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MailOpenIcon, Loader2Icon, XIcon, CheckIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from '@/components/ui/toast'
import { tenantUserService } from '@/lib/api/services/iam/tenant-user'
import { SYSTEM_SCOPES } from '@/lib/constants/scopes'

interface InviteModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export const InviteModal: React.FC<InviteModalProps> = ({
    open,
    onOpenChange,
    onSuccess,
}) => {
    const { t } = useTranslation()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [username, setUsername] = useState('')
    const [role, setRole] = useState<'admin' | 'analyst'>('analyst')
    const [selectedScopes, setSelectedScopes] = useState<string[]>(['audit:read'])

    const handleScopeChange = (scopeId: string, checked: boolean) => {
        if (checked) {
            setSelectedScopes((prev) => [...prev, scopeId])
        } else {
            setSelectedScopes((prev) => prev.filter((id) => id !== scopeId))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim() || !firstName.trim() || !lastName.trim() || !username.trim()) {
            toast.add({
                title: t('pages.private.tenant.users.modals.invite.error_title'),
                description: 'All fields are required.',
                type: 'error',
            })
            return
        }

        try {
            setIsSubmitting(true)
            await tenantUserService.inviteUser({
                email: email.trim(),
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                username: username.trim(),
                role,
                scopes: selectedScopes,
            })

            toast.add({
                title: t('pages.private.tenant.users.modals.invite.success_title'),
                description: 'Invitation sent successfully.',
                type: 'success',
            })

            // Reset form
            setFirstName('')
            setLastName('')
            setEmail('')
            setUsername('')
            setRole('analyst')
            setSelectedScopes(['audit:read'])

            onSuccess()
            onOpenChange(false)
        } catch (err: any) {
            console.error('Failed to send invitation:', err)
            toast.add({
                title: t('pages.private.tenant.users.modals.invite.error_title'),
                description: err.response?.data?.detail || 'An error occurred while sending the invitation.',
                type: 'error',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <MailOpenIcon className="size-4 text-primary" />
                            <DialogTitle>{t('pages.private.tenant.users.modals.invite.title')}</DialogTitle>
                        </div>
                        <DialogDescription>
                            {t('pages.private.tenant.users.modals.invite.description')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="firstName">{t('pages.private.tenant.users.modals.invite.fields.first_name.label')}</Label>
                            <Input
                                id="firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder={t('pages.private.tenant.users.modals.invite.fields.first_name.placeholder')}
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="lastName">{t('pages.private.tenant.users.modals.invite.fields.last_name.label')}</Label>
                            <Input
                                id="lastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder={t('pages.private.tenant.users.modals.invite.fields.last_name.placeholder')}
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="email">{t('pages.private.tenant.users.modals.invite.fields.email.label')}</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('pages.private.tenant.users.modals.invite.fields.email.placeholder')}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="username">{t('pages.private.tenant.users.modals.invite.fields.username.label')}</Label>
                        <Input
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder={t('pages.private.tenant.users.modals.invite.fields.username.placeholder')}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="role">{t('pages.private.tenant.users.modals.invite.fields.role.label')}</Label>
                        <Select
                            value={role}
                            onValueChange={(val: 'admin' | 'analyst') => setRole(val)}
                            disabled={isSubmitting}
                        >
                            <SelectTrigger id="role">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">{t('pages.private.tenant.users.roles.admin')}</SelectItem>
                                <SelectItem value="analyst">{t('pages.private.tenant.users.roles.analyst')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>{t('pages.private.tenant.users.modals.invite.fields.scopes.label')}</Label>
                        <div className="space-y-2 border rounded-lg p-3 bg-muted/50">
                            {SYSTEM_SCOPES.map((group) => (
                                <div key={group.key} className="space-y-2">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        {t(group.labelKey)}
                                    </div>
                                    <div className="grid gap-2">
                                        {group.actions.map((action) => (
                                            <div key={action.id} className="flex items-start gap-2">
                                                <Checkbox
                                                    id={`scope-${action.id}`}
                                                    checked={selectedScopes.includes(action.id)}
                                                    onCheckedChange={(checked: boolean) =>
                                                        handleScopeChange(action.id, checked)
                                                    }
                                                    disabled={isSubmitting}
                                                />
                                                <div className="grid gap-0.5 leading-none">
                                                    <Label
                                                        htmlFor={`scope-${action.id}`}
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
                            {t('pages.private.tenant.users.modals.invite.submit')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
