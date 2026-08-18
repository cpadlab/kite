import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2Icon, UserIcon, MailIcon, AtSignIcon, InfoIcon, Loader2Icon, LockIcon, EyeIcon, EyeOffIcon, LogInIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { InputPasswordStrength } from '@/components/ui/input-password-strength'
import { tenantService } from '@/lib/api/services/iam/tenant'
import type { TenantInvitationPublic } from '@/types/iam'
import { registerSchema, type RegisterSchemaType } from './schema'
import { Label } from '@/components/ui/label'

interface RegisterFormProps {
    token: string
    invitation: TenantInvitationPublic
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ token, invitation }) => {
    
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [isConfirmVisible, setIsConfirmVisible] = useState(false)

    const schema = registerSchema(t)

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm<RegisterSchemaType>({
        resolver: zodResolver(schema),
        defaultValues: {
            password: '',
            confirm_password: '',
        },
    })

    const onSubmit = async (data: RegisterSchemaType) => {
        try {
            await tenantService.acceptInvitation({
                token,
                password: data.password,
            })

            toast.add({
                title: t('pages.public.register.title'),
                description: t('pages.public.register.success_toast'),
                type: 'success',
            })

            navigate('/login')
        } catch (err: unknown) {
            const errorObj = err as { response?: { data?: { detail?: string } } }
            const errorMsg = errorObj.response?.data?.detail || t('pages.private.platform.tenants.messages.error_default')

            toast.add({
                title: t('pages.public.login.error_title'),
                description: errorMsg,
                type: 'error',
            })
        }
    }

    const userFullName = [invitation.first_name, invitation.last_name].filter(Boolean).join(' ') || 'Usuario'
    const userUsername = invitation.username || invitation.email.split('@')[0]

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
            
            <div className="space-y-2">
                <Label>
                    {t('pages.public.register.tenant_label')}
                </Label>
                <InputGroup>
                    <InputGroupAddon align="inline-start">
                        <Building2Icon className="size-4" />
                    </InputGroupAddon>
                    <InputGroupInput value={invitation.tenant_name} disabled className="bg-muted/50" />
                </InputGroup>
            </div>

            <div className="grid grid-cols-2 gap-3">
                
                <div className="space-y-2">
                    <Label>
                        {t('pages.public.register.name_label')}
                    </Label>
                    <InputGroup>
                        <InputGroupAddon align="inline-start">
                            <UserIcon className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput value={userFullName} disabled className="bg-muted/50" />
                    </InputGroup>
                </div>

                <div className="space-y-2">
                    <Label>
                        {t('pages.public.register.username_label')}
                    </Label>
                    <InputGroup>
                        <InputGroupAddon align="inline-start">
                            <AtSignIcon className="size-4" />
                        </InputGroupAddon>
                        <InputGroupInput value={userUsername} disabled className="bg-muted/50" />
                    </InputGroup>
                </div>

            </div>

            <div className="space-y-2">
                <Label>
                    {t('pages.public.register.email_label')}
                </Label>
                <InputGroup>
                    <InputGroupAddon align="inline-start">
                        <MailIcon className="size-4" />
                    </InputGroupAddon>
                    <InputGroupInput value={invitation.email} disabled className="bg-muted/50" />
                </InputGroup>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/60 text-muted-foreground border text-xs">
                <InfoIcon className="size-4 shrink-0 text-primary mt-0.5" />
                <span>{t('pages.public.register.update_hint')}</span>
            </div>

            <div className="space-y-1 pt-1">
                <Controller name="password" control={control}
                    render={({ field }) => (
                        <InputPasswordStrength value={field.value} onChange={field.onChange} onBlur={field.onBlur} disabled={isSubmitting} label={t('pages.public.register.password_label')} error={errors.password?.message} />
                    )} />
            </div>

            <div className="space-y-2">
                <Label>
                    {t('pages.public.register.confirm_password_label')}
                </Label>
                <InputGroup>
                    <InputGroupAddon align="inline-start">
                        <LockIcon className="size-4" />
                    </InputGroupAddon>
                    <InputGroupInput type={isConfirmVisible ? 'text' : 'password'} placeholder={t('pages.public.register.confirm_password_placeholder')} disabled={isSubmitting} {...register('confirm_password')} />
                    <InputGroupAddon align="inline-end">
                        <Button type="button" variant="ghost" size="icon" onClick={() => setIsConfirmVisible((prev) => !prev)} disabled={isSubmitting} className="text-muted-foreground hover:bg-transparent cursor-pointer" >
                            {isConfirmVisible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                            <span className="sr-only">Toggle confirm password visibility</span>
                        </Button>
                    </InputGroupAddon>
                </InputGroup>
                {errors.confirm_password && (
                    <p className="text-xs text-destructive mt-0.5">{errors.confirm_password.message}</p>
                )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                    <>
                        <Loader2Icon className="size-4 animate-spin" />
                        {t('pages.public.register.submitting')}
                    </>
                ) : (
                    <>
                        {t('pages.public.register.submit_button')}
                        <LogInIcon />
                    </>
                )}
            </Button>
            
        </form>
    )
}
