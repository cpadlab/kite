import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyRoundIcon, Loader2Icon, ChevronDownIcon, KeyIcon, XIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { toast } from '@/components/ui/toast'
import { apiKeyService } from '@/lib/api/services/iam/api-key'
import { SYSTEM_SCOPES } from '@/lib/constants/scopes'
import { ScrollArea } from '@/components/ui/scroll-area'

interface CreateApiKeyModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    onKeyGenerated: (secretKey: string) => void
}

export const CreateApiKeyModal: React.FC<CreateApiKeyModalProps> = ({
    isOpen,
    onOpenChange,
    onSuccess,
    onKeyGenerated,
}) => {

    const { t } = useTranslation()

    const [name, setName] = useState('')
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
        const defaultExp = new Date()
        defaultExp.setFullYear(defaultExp.getFullYear() + 1)
        return defaultExp
    })
    const [selectedScopes, setSelectedScopes] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleScopeToggle = (scopeId: string, checked: boolean) => {
        if (checked) {
            setSelectedScopes((prev) => [...prev, scopeId])
        } else {
            setSelectedScopes((prev) => prev.filter((id) => id !== scopeId))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim()) {
            toast.add({
                title: t('pages.private.tenant.api_keys.modals.create.errors.name_required'),
                type: 'error',
            })
            return
        }

        if (!selectedScopes || selectedScopes.length === 0) {
            toast.add({
                title: t('pages.private.tenant.api_keys.modals.create.errors.scopes_required'),
                type: 'error',
            })
            return
        }

        const calculatedDays = selectedDate
            ? Math.max(1, Math.min(365, Math.ceil((selectedDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24))))
            : 365


        try {
            setIsSubmitting(true)
            const response = await apiKeyService.createApiKey({
                name: name.trim(),
                expiration_days: calculatedDays,
                scopes: selectedScopes,
            })

            toast.add({
                title: t('pages.private.tenant.api_keys.modals.create.success_title'),
                description: response.message,
                type: 'success',
            })

            onSuccess()
            setName('')
            const defaultExp = new Date()
            defaultExp.setFullYear(defaultExp.getFullYear() + 1)
            setSelectedDate(defaultExp)
            setSelectedScopes([])
            onOpenChange(false)
            onKeyGenerated(response.secret_key)
        } catch (err: any) {
            console.error('Failed to create API key:', err)
            toast.add({
                title: t('pages.private.tenant.api_keys.modals.create.error_title'),
                description: err.response?.data?.detail || t('pages.private.tenant.api_keys.modals.create.error_desc'),
                type: 'error',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const calculatedDays = selectedDate
        ? Math.max(1, Math.min(365, Math.ceil((selectedDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24))))
        : 365

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                
                <DialogHeader>
                    <div className="flex items-center gap-2 text-primary">
                        <KeyRoundIcon className="size-5" />
                        <DialogTitle>{t('pages.private.tenant.api_keys.modals.create.title')}</DialogTitle>
                    </div>
                    <DialogDescription>
                        {t('pages.private.tenant.api_keys.modals.create.description')}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    <div className="space-y-2">
                        <Label htmlFor="key-name">{t('pages.private.tenant.api_keys.modals.create.fields.name.label')}</Label>
                        <Input id="key-name" placeholder={t('pages.private.tenant.api_keys.modals.create.fields.name.placeholder')} value={name} onChange={(e) => setName(e.target.value)} disabled={isSubmitting} maxLength={100} required/>
                    </div>

                    <div className="space-y-2">
                        
                        <Label>
                            {t('pages.private.tenant.api_keys.modals.create.fields.expiration.label')}
                        </Label>
                        
                        <DropdownMenu>
                            
                            <DropdownMenuTrigger
                                render={
                                    <Button
                                        type="button" variant="outline" className="w-full justify-start">
                                        <div className="flex items-center gap-2 text-foreground justify-between w-full">
                                            <span>
                                                {selectedDate
                                                    ? t('pages.private.tenant.api_keys.modals.create.fields.expiration.selected_hint', {date: selectedDate.toLocaleDateString(), days: calculatedDays,})
                                                    : t('pages.private.tenant.api_keys.modals.create.fields.expiration.placeholder')}
                                            </span>
                                        </div>
                                        <ChevronDownIcon className="size-4 text-muted-foreground opacity-70" />
                                    </Button>
                                }
                            />

                            <DropdownMenuContent align="start" className="p-1 border rounded-xl w-full shadow-xl bg-popover z-50">
                                <Calendar mode="single" defaultMonth={selectedDate} selected={selectedDate} onSelect={setSelectedDate}
                                    disabled={(date) => {
                                        const now = new Date()
                                        now.setHours(0, 0, 0, 0)
                                        const max = new Date()
                                        max.setFullYear(now.getFullYear() + 1)
                                        return date < now || date > max
                                    }} className="rounded-lg" />
                            </DropdownMenuContent>

                        </DropdownMenu>
                        
                        <p className="text-[11px] text-muted-foreground">{t('pages.private.tenant.api_keys.modals.create.fields.expiration.hint')}</p>

                    </div>

                    <div className="space-y-3 pt-2 flex-1 min-h-0 flex flex-col">
                        <Label>{t('pages.private.tenant.api_keys.modals.create.fields.scopes.label')}</Label>
                        <ScrollArea className="h-64 w-full rounded-lg border p-3 bg-muted/30">
                            <div className="space-y-4 pr-3">
                                {SYSTEM_SCOPES.map((group) => (
                                    <div key={group.key} className="space-y-2">
                                        <div className="text-xs font-semibold uppercase text-muted-foreground">{t(group.labelKey)}</div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {group.actions.map((action) => {
                                                const isChecked = selectedScopes.includes(action.id)
                                                return (
                                                    <label key={action.id} className={`flex items-start gap-2.5 p-2.5 rounded-md border text-xs cursor-pointer transition-colors ${ isChecked ? 'bg-primary/5 border-primary/40' : 'bg-card border-border hover:bg-muted/50' }`}>
                                                        <Checkbox checked={isChecked}onCheckedChange={(checked) =>handleScopeToggle(action.id, Boolean(checked))}disabled={isSubmitting} className="mt-0.5"/>
                                                        <div className="space-y-0.5">
                                                            <div className="font-medium text-foreground">{t(action.labelKey)}</div>
                                                            {action.descriptionKey && (
                                                                <div className="text-[11px] text-muted-foreground">{t(action.descriptionKey)}</div>
                                                            )}
                                                        </div>
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            <XIcon />
                            {t('pages.private.tenant.api_keys.cancel')}
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !name.trim() || !selectedDate || selectedScopes.length === 0}>

                            {isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
                            {t('pages.private.tenant.api_keys.modals.create.submit')}
                            {!isSubmitting && <KeyIcon />}
                        </Button>
                    </DialogFooter>

                </form>
            </DialogContent>
        </Dialog>
    )
}
