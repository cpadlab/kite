import React, { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Button as AriaButton, Group, Input as AriaInput, Label, NumberField } from 'react-aria-components'
import { Building2Icon, UserIcon, AtSignIcon, MailIcon, MinusIcon, PlusIcon, Loader2Icon, XIcon, SendIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { tenantService } from '@/lib/api/services/iam/tenant'

const createTenantSchema = (t: (key: string) => string) =>
    z.object({
        name: z.string().min(2, t('pages.private.platform.tenants.validation.name_required')),
        owner_first_name: z.string().min(1, t('pages.private.platform.tenants.validation.first_name_required')),
        owner_last_name: z.string().min(1, t('pages.private.platform.tenants.validation.last_name_required')),
        owner_username: z.string().min(3, t('pages.private.platform.tenants.validation.username_required')),
        owner_email: z.string().email(t('pages.private.platform.tenants.validation.email_invalid')),
        max_users: z.number().min(1, t('pages.private.platform.tenants.validation.max_users_min')),
        storage_quota_gb: z.number().min(1, t('pages.private.platform.tenants.validation.storage_min')),
    })

export type CreateTenantFormData = z.infer<ReturnType<typeof createTenantSchema>>

interface CreateTenantModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export const CreateTenantModal: React.FC<CreateTenantModalProps> = ({
    isOpen,
    onOpenChange,
    onSuccess,
}) => {
    const { t } = useTranslation()

    const schema = createTenantSchema(t)

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<CreateTenantFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            owner_first_name: '',
            owner_last_name: '',
            owner_username: '',
            owner_email: '',
            max_users: 5,
            storage_quota_gb: 10,
        },
    })

    useEffect(() => {
        if (!isOpen) {
            reset()
        }
    }, [isOpen, reset])

    const onSubmit = async (data: CreateTenantFormData) => {
        try {
            const response = await tenantService.createTenant({
                name: data.name.trim(),
                owner_first_name: data.owner_first_name.trim(),
                owner_last_name: data.owner_last_name.trim(),
                owner_username: data.owner_username.trim(),
                owner_email: data.owner_email.trim(),
                max_users: data.max_users,
                storage_quota_gb: data.storage_quota_gb,
            })

            toast.add({
                title: t('pages.private.platform.tenants.modal.title'),
                description: response.message || t('pages.private.platform.tenants.messages.success'),
                type: 'success',
            })

            onOpenChange(false)
            reset()
            if (onSuccess) {
                onSuccess()
            }
        } catch (err: unknown) {
            const errorObj = err as { response?: { data?: { detail?: string } } }
            const errorMsg = errorObj.response?.data?.detail || t('pages.private.platform.tenants.messages.error_default')

            toast.add({
                title: t('pages.private.platform.tenants.messages.error_default'),
                description: errorMsg,
                type: 'error',
            })
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                
                <DialogHeader>
                    <DialogTitle>{t('pages.private.platform.tenants.modal.title')}</DialogTitle>
                    <DialogDescription>
                        {t('pages.private.platform.tenants.modal.description')}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    
                    <div className="space-y-2">
                        <Label className='block'>
                            {t('pages.private.platform.tenants.modal.name_label')}
                        </Label>
                        <InputGroup>
                            <InputGroupAddon align="inline-start">
                                <Building2Icon className="size-4" />
                            </InputGroupAddon>
                            <InputGroupInput
                                placeholder={t('pages.private.platform.tenants.modal.name_placeholder')}
                                disabled={isSubmitting}
                                {...register('name')}
                            />
                        </InputGroup>
                        {errors.name && (
                            <p className="text-xs text-destructive mt-0.5">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label className='block'>
                                {t('pages.private.platform.tenants.modal.owner_first_name_label')}
                            </Label>
                            <InputGroup>
                                <InputGroupAddon align="inline-start">
                                    <UserIcon className="size-4" />
                                </InputGroupAddon>
                                <InputGroupInput placeholder={t('pages.private.platform.tenants.modal.owner_first_name_placeholder')} disabled={isSubmitting} {...register('owner_first_name')} />
                            </InputGroup>
                            {errors.owner_first_name && (
                                <p className="text-xs text-destructive mt-0.5">{errors.owner_first_name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className='block'>
                                {t('pages.private.platform.tenants.modal.owner_last_name_label')}
                            </Label>
                            <InputGroup>
                                <InputGroupAddon align="inline-start">
                                    <UserIcon className="size-4" />
                                </InputGroupAddon>
                                <InputGroupInput placeholder={t('pages.private.platform.tenants.modal.owner_last_name_placeholder')} disabled={isSubmitting} {...register('owner_last_name')} />
                            </InputGroup>
                            {errors.owner_last_name && (
                                <p className="text-xs text-destructive mt-0.5">{errors.owner_last_name.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label className='block'>
                                {t('pages.private.platform.tenants.modal.owner_username_label')}
                            </Label>
                            <InputGroup>
                                <InputGroupAddon align="inline-start">
                                    <AtSignIcon className="size-4" />
                                </InputGroupAddon>
                                <InputGroupInput placeholder={t('pages.private.platform.tenants.modal.owner_username_placeholder')} disabled={isSubmitting} {...register('owner_username')} />
                            </InputGroup>
                            {errors.owner_username && (
                                <p className="text-xs text-destructive mt-0.5">{errors.owner_username.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className='block'>
                                {t('pages.private.platform.tenants.modal.owner_email_label')}
                            </Label>
                            <InputGroup>
                                <InputGroupAddon align="inline-start">
                                    <MailIcon className="size-4" />
                                </InputGroupAddon>
                                <InputGroupInput type="email" placeholder={t('pages.private.platform.tenants.modal.owner_email_placeholder')} disabled={isSubmitting} {...register('owner_email')} />
                            </InputGroup>
                            {errors.owner_email && (
                                <p className="text-xs text-destructive mt-0.5">{errors.owner_email.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                        
                        <Controller name="max_users" control={control}
                            render={({ field }) => (
                                <NumberField value={field.value} onChange={field.onChange} minValue={1} isDisabled={isSubmitting}>
                                    <Label className='mb-2 block text-xs text-muted-foreground'>
                                        {t('pages.private.platform.tenants.modal.max_users_label')}
                                    </Label>
                                    <Group className="border-input data-focus-within:border-ring data-focus-within:ring-ring/50 data-focus-within:has-aria-invalid:border-destructive data-focus-within:has-aria-invalid:ring-destructive/20 dark:bg-input/30 dark:data-focus-within:has-aria-invalid:ring-destructive/40 relative inline-flex h-8 w-full min-w-0 items-center overflow-hidden rounded-lg border bg-transparent text-base whitespace-nowrap transition-colors outline-none data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-focus-within:ring-3 md:text-sm">
                                        <AriaButton slot="decrement" className="border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground -ms-px flex aspect-square h-[inherit] items-center justify-center rounded-l-lg border text-sm transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50">
                                            <MinusIcon className="size-4" />
                                        </AriaButton>
                                        <AriaInput className="selection:bg-primary selection:text-primary-foreground w-full grow px-2.5 py-1 text-center tabular-nums outline-none" />
                                        <AriaButton slot="increment" className="border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground -me-px flex aspect-square h-[inherit] items-center justify-center rounded-r-lg border text-sm transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50">
                                            <PlusIcon className="size-4" />
                                        </AriaButton>
                                    </Group>
                                    {errors.max_users && (
                                        <p className="text-xs text-destructive mt-0.5">{errors.max_users.message}</p>
                                    )}
                                </NumberField>
                            )}
                        />

                        <Controller name="storage_quota_gb" control={control}
                            render={({ field }) => (
                                <NumberField value={field.value} onChange={field.onChange} minValue={1} isDisabled={isSubmitting} >
                                    <Label className='mb-2 block text-xs text-muted-foreground'>
                                        {t('pages.private.platform.tenants.modal.storage_quota_label')}
                                    </Label>
                                    <Group className="border-input data-focus-within:border-ring data-focus-within:ring-ring/50 data-focus-within:has-aria-invalid:border-destructive data-focus-within:has-aria-invalid:ring-destructive/20 dark:bg-input/30 dark:data-focus-within:has-aria-invalid:ring-destructive/40 relative inline-flex h-8 w-full min-w-0 items-center overflow-hidden rounded-lg border bg-transparent text-base whitespace-nowrap transition-colors outline-none data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-focus-within:ring-3 md:text-sm">
                                        <AriaButton slot="decrement" className="border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground -ms-px flex aspect-square h-[inherit] items-center justify-center rounded-l-lg border text-sm transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50">
                                            <MinusIcon className="size-4" />
                                        </AriaButton>
                                        <AriaInput className="selection:bg-primary selection:text-primary-foreground w-full grow px-2.5 py-1 text-center tabular-nums outline-none" />
                                        <AriaButton slot="increment" className="border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground -me-px flex aspect-square h-[inherit] items-center justify-center rounded-r-lg border text-sm transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50">
                                            <PlusIcon className="size-4" />
                                        </AriaButton>
                                    </Group>
                                    {errors.storage_quota_gb && (
                                        <p className="text-xs text-destructive mt-0.5">{errors.storage_quota_gb.message}</p>
                                    )}
                                </NumberField>
                            )}
                        />

                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            <XIcon className='size-4' />
                            {t('pages.private.platform.tenants.modal.cancel')}
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2Icon className="size-4 animate-spin" />
                                    {t('pages.private.platform.tenants.modal.submitting')}
                                </>
                            ) : (
                                <>
                                    {t('pages.private.platform.tenants.modal.submit')}
                                    <SendIcon className='size-4' />
                                </>
                            )}
                        </Button>
                    </DialogFooter>

                </form>
            </DialogContent>
        </Dialog>
    )
}
