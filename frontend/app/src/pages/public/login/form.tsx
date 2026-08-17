import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/auth'
import { loginSchema, type LoginSchemaType } from './schema'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { UserIcon, LockIcon, EyeIcon, EyeOffIcon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toast'

export function LoginForm() {

    const { t } = useTranslation()
    const navigate = useNavigate()
    const {
        login,
        isLoading,
        error: authError,
        clearError,
    } = useAuth()

    const [showPassword, setShowPassword] = React.useState(false)

    const form = useForm<LoginSchemaType>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            identifier: '',
            password: '',
        },
    })

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = form

    React.useEffect(() => {
        if (authError) {
            toast.add({
                title: t('pages.public.login.error_title', 'Error'),
                description: authError,
                type: 'error',
            })
            clearError()
        }
    }, [authError, clearError, t])

    const onSubmit = async (data: LoginSchemaType) => {
        clearError()
        try {
            
            const response = await login({
                identifier: data.identifier,
                password: data.password,
            })

            if (response.requires_2fa) {
                navigate('/login/totp', {
                    state: {
                        identifier: data.identifier,
                        password: data.password,
                    },
                })
            }

        } catch (err) {}
    }

    const onInvalid = (formErrors: typeof errors) => {
        const firstErrorField = Object.keys(formErrors)[0] as keyof typeof formErrors
        if (firstErrorField && formErrors[firstErrorField]) {
            toast.add({
                title: t('pages.public.login.error_title', 'Error'),
                description: formErrors[firstErrorField]?.message,
                type: 'error',
            })
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">

            <Controller name="identifier" control={control}
                render={({ field, fieldState }) => (
                    <div className="flex flex-col gap-2">
                        <Label htmlFor={field.name}>
                            {t('pages.public.login.identifier_label')}
                        </Label>
                        <InputGroup>
                            <InputGroupAddon align="inline-start">
                                <UserIcon className="size-4 text-muted-foreground" />
                            </InputGroupAddon>
                            <InputGroupInput {...field} id={field.name} type="text" placeholder={t('pages.public.login.identifier_placeholder')} disabled={isLoading} aria-invalid={fieldState.invalid} />
                        </InputGroup>
                    </div>
                )}
            />

            <Controller name="password" control={control}
                render={({ field, fieldState }) => (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor={field.name}>{t('pages.public.login.password_label')}</Label>
                            <Link to="/recover-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                                {t('pages.public.login.forgot_password')}
                            </Link>
                        </div>
                        <InputGroup>
                            <InputGroupAddon align="inline-start">
                                <LockIcon className="size-4 text-muted-foreground" />
                            </InputGroupAddon>
                            <InputGroupInput {...field} id={field.name} type={showPassword ? 'text' : 'password'} placeholder={t('pages.public.login.password_placeholder')} disabled={isLoading} aria-invalid={fieldState.invalid}/>
                            <InputGroupAddon align="inline-end">
                                <InputGroupButton size="icon-xs" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}>
                                    {showPassword ? (<EyeOffIcon className="size-4" />
                                    ) : (<EyeIcon className="size-4" />)}
                                </InputGroupButton>
                            </InputGroupAddon>
                        </InputGroup>
                    </div>
                )}
            />

            <Button type="submit" disabled={isLoading} className="w-full cursor-pointer">
                {isLoading ? t('pages.public.login.loading') : t('pages.public.login.submit_button')}
            </Button>
            
        </form>
    )
}

