import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth'
import { loginSchema, type LoginSchemaType } from './schema'
import { Button } from '@/components/ui/button'
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from '@/components/ui/input-group'
import { User, Lock, Eye, EyeOff } from 'lucide-react'
import { Label } from '@/components/ui/label'

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

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {authError && (
                <div className="p-3 text-sm rounded-md bg-destructive/10 text-destructive border border-destructive/20 font-medium">
                    {authError}
                </div>
            )}

            <Controller name="identifier" control={control}
                render={({ field, fieldState }) => (
                    <div className="flex flex-col gap-2">
                        <Label htmlFor={field.name}>
                            {t('pages.public.login.identifier_label')}
                        </Label>
                        <InputGroup>
                            <InputGroupAddon align="inline-start">
                                <User className="size-4 text-muted-foreground" />
                            </InputGroupAddon>
                            <InputGroupInput {...field} id={field.name} type="text" placeholder={t('pages.public.login.identifier_placeholder')} disabled={isLoading} aria-invalid={fieldState.invalid} />
                        </InputGroup>
                        {fieldState.invalid && (
                            <span className="text-xs text-destructive font-medium">
                                {fieldState.error?.message}
                            </span>
                        )}
                    </div>
                )}
            />

            <Controller name="password" control={control}
                render={({ field, fieldState }) => (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor={field.name}>{t('pages.public.login.password_label')}</Label>
                        </div>
                        <InputGroup>
                            <InputGroupAddon align="inline-start">
                                <Lock className="size-4 text-muted-foreground" />
                            </InputGroupAddon>
                            <InputGroupInput {...field} id={field.name} type={showPassword ? 'text' : 'password'} placeholder={t('pages.public.login.password_placeholder')} disabled={isLoading} aria-invalid={fieldState.invalid}/>
                            <InputGroupAddon align="inline-end">
                                <InputGroupButton size="icon-xs" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}>
                                    {showPassword ? (<EyeOff className="size-4" />
                                    ) : (<Eye className="size-4" />)}
                                </InputGroupButton>
                            </InputGroupAddon>
                        </InputGroup>
                        {fieldState.invalid && (
                            <span className="text-xs text-destructive font-medium">
                                {fieldState.error?.message}
                            </span>
                        )}
                    </div>
                )}
            />

            <Button type="submit" disabled={isLoading} className="w-full font-medium cursor-pointer">
                {isLoading ? t('pages.public.login.loading') : t('pages.public.login.submit_button')}
            </Button>
            
        </form>
    )
}

