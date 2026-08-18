import React, { useEffect } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/context/auth'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toast'
import { totpSchema, type TotpSchemaType } from './schema'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp'
import Logo from '@/assets/logo'

export default function TOTPPage() {
    
    const { t } = useTranslation()
    const location = useLocation()
    const navigate = useNavigate()
    const { isAuthenticated, isLoading, error: authError, submit2FACode, clearError } = useAuth()

    const state = location.state as { identifier?: string; password?: string } | null

    const form = useForm<TotpSchemaType>({
        resolver: zodResolver(totpSchema),
        defaultValues: {
            code: '',
        },
    })

    const {
        control,
        handleSubmit,
        formState: { errors },
        watch,
    } = form

    const codeValue = watch('code') || ''

    useEffect(() => {
        if (codeValue.length === 6) {
            handleSubmit(onSubmit, onInvalid)()
        }
    }, [codeValue, handleSubmit])

    useEffect(() => {
        if (authError) {
            toast.add({
                title: t('pages.public.login.error_title', 'Error'),
                description: authError,
                type: 'error',
            })
            clearError()
        }
    }, [authError, clearError, t])

    if (isAuthenticated && !isLoading) {
        return <Navigate to="/" replace />
    }

    const onSubmit = async (data: TotpSchemaType) => {
        if (isLoading) return
        clearError()
        try {
            await submit2FACode(data.code)
        } catch (err) {}
    }

    const onInvalid = (formErrors: typeof errors) => {
        if (formErrors.code) {
            toast.add({
                title: t('pages.public.login.error_title', 'Error'),
                description: formErrors.code.message,
                type: 'error',
            })
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="w-full max-w-md md:min-w-md min-w-full space-y-4 flex flex-col items-center relative z-10">

                <div className='text-center space-y-2'>
                    <div className='flex justify-center items-center gap-2'>
                        <div className='flex p-2 dark:bg-primary bg-primary-foreground rounded-lg'>
                            <Logo className="size-6 fill-primary dark:fill-primary-foreground" />
                        </div>
                        <h2 className="text-2xl leading-none font-bold dark:text-primary-foreground text-primary">{t('pages.public.login.title')}</h2>
                    </div>
                </div>

                <div className="space-y-2 text-center w-full">
                    <h1 className="text-2xl font-semibold tracking-tight">{t('pages.public.totp.title')}</h1>
                    <p className="text-sm text-muted-foreground">{t('pages.public.totp.description')}</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="w-full flex flex-col items-center space-y-6">
                    <Controller name="code" control={control}
                        render={({ field }) => (
                            <div className="flex flex-col items-center gap-2">
                                <Label htmlFor={field.name}>{t('pages.public.totp.label')}</Label>
                                <InputOTP id={field.name} maxLength={6} value={field.value} onChange={field.onChange} disabled={isLoading} autoFocus>
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                    </InputOTPGroup>
                                    <InputOTPSeparator />
                                    <InputOTPGroup>
                                        <InputOTPSlot index={3} />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>
                        )}
                    />

                    <Button type="submit" disabled={codeValue.length !== 6 || isLoading} className="w-full font-medium cursor-pointer">
                        {isLoading ? t('pages.public.totp.loading') : t('pages.public.totp.submit_button')}
                    </Button>
                </form>

                <button
                    onClick={() => navigate('/login')}
                    className="text-xs text-muted-foreground hover:text-foreground underline transition-colors cursor-pointer"
                >
                    Go back to Sign In
                </button>

            </div>
        </div>
    )
}
