import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyRoundIcon, AlertTriangleIcon, Loader2Icon, XIcon, CheckIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from '@/components/ui/toast'
import { tenantUserService } from '@/lib/api/services/iam/tenant-user'
import type { TenantMemberItem } from '@/types/iam'

interface TransferOwnershipModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    members: TenantMemberItem[]
    selectedTargetMember: TenantMemberItem | null
    currentUser2FA: boolean
    onSuccess: () => void
}

export const TransferOwnershipModal: React.FC<TransferOwnershipModalProps> = ({
    open,
    onOpenChange,
    members,
    selectedTargetMember,
    currentUser2FA,
    onSuccess,
}) => {
    const { t } = useTranslation()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [targetUserId, setTargetUserId] = useState<string>('')
    const [totpCode, setTotpCode] = useState('')

    useEffect(() => {
        if (selectedTargetMember) {
            setTargetUserId(selectedTargetMember.id)
        } else {
            setTargetUserId('')
        }
    }, [selectedTargetMember, open])

    const eligibleMembers = members.filter((m) => m.role !== 'owner')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!targetUserId) {
            toast.add({
                title: t('pages.private.tenant.users.modals.transfer_ownership.error_title'),
                description: 'Please select a team member.',
                type: 'error',
            })
            return
        }

        try {
            setIsSubmitting(true)
            await tenantUserService.transferOwnership({
                target_user_id: targetUserId,
                totp_code: currentUser2FA ? totpCode.trim() : undefined,
            })

            toast.add({
                title: t('pages.private.tenant.users.modals.transfer_ownership.success_title'),
                description: 'Ownership transferred successfully.',
                type: 'success',
            })

            setTotpCode('')
            onSuccess()
            onOpenChange(false)
        } catch (err: any) {
            console.error('Failed to transfer ownership:', err)
            toast.add({
                title: t('pages.private.tenant.users.modals.transfer_ownership.error_title'),
                description: err.response?.data?.detail || 'An error occurred while transferring ownership.',
                type: 'error',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const selectedMemberName = selectedTargetMember
        ? `${selectedTargetMember.first_name} ${selectedTargetMember.last_name}`
        : targetUserId
        ? (() => {
              const found = members.find((m) => m.id === targetUserId)
              return found ? `${found.first_name} ${found.last_name}` : ''
          })()
        : 'the selected member'

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <KeyRoundIcon className="size-4 text-destructive" />
                            <DialogTitle>{t('pages.private.tenant.users.modals.transfer_ownership.title')}</DialogTitle>
                        </div>
                        <DialogDescription>
                            {t('pages.private.tenant.users.modals.transfer_ownership.description', { name: selectedMemberName })}
                        </DialogDescription>
                    </DialogHeader>

                    <Alert variant="destructive" className="bg-destructive/5 border-destructive/50">
                        <AlertTriangleIcon className="size-4" />
                        <AlertTitle>{t('pages.private.tenant.users.modals.transfer_ownership.warning_title')}</AlertTitle>
                        <AlertDescription className="text-xs">
                            {t('pages.private.tenant.users.modals.transfer_ownership.warning_desc')}
                        </AlertDescription>
                    </Alert>

                    {!selectedTargetMember && (
                        <div className="space-y-1">
                            <Label htmlFor="target-user-select">Select New Owner</Label>
                            <Select
                                value={targetUserId}
                                onValueChange={setTargetUserId}
                                disabled={isSubmitting}
                            >
                                <SelectTrigger id="target-user-select">
                                    <SelectValue placeholder="Choose a member..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {eligibleMembers.map((m) => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.first_name} {m.last_name} (@{m.username}) - {m.role}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {currentUser2FA && (
                        <div className="space-y-2 border rounded-lg p-3 bg-muted/50">
                            <Label htmlFor="totpCode-transfer" className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                                {t('pages.private.tenant.users.modals.transfer_ownership.totp_label')}
                            </Label>
                            <Input
                                id="totpCode-transfer"
                                value={totpCode}
                                onChange={(e) => setTotpCode(e.target.value)}
                                placeholder="000000"
                                maxLength={6}
                                className="text-center font-mono letter-spacing-widest"
                                disabled={isSubmitting}
                            />
                            <p className="text-[11px] text-muted-foreground mt-1">
                                {t('pages.private.tenant.users.modals.transfer_ownership.totp_hint')}
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
                                <CheckIcon className="size-4 mr-1" />
                            )}
                            {t('pages.private.tenant.users.modals.transfer_ownership.confirm')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
