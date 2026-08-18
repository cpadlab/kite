import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/auth'
import LoadingScreen from '@/components/blocks/loading/component'
import { tenantService } from '@/lib/api/services/iam/tenant'
import type { TenantInvitationPublic } from '@/types/iam'
import Logo from '@/assets/logo'
import { InvalidTokenCard } from './components/invalid-token'
import { RegisterForm } from './form'

export default function RegisterPage() {
    
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth()

    const [isValidatingToken, setIsValidatingToken] = useState(true)
    const [isTokenValid, setIsTokenValid] = useState(false)
    const [invitation, setInvitation] = useState<TenantInvitationPublic | null>(null)

    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setIsTokenValid(false)
                setIsValidatingToken(false)
                return
            }

            try {
                const res = await tenantService.validateInvitationToken(token)
                if (res && res.is_valid) {
                    setInvitation(res)
                    setIsTokenValid(true)
                } else {
                    setIsTokenValid(false)
                }
            } catch (err) {
                setIsTokenValid(false)
            } finally {
                setIsValidatingToken(false)
            }
        }

        validateToken()
    }, [token])

    if (isAuthenticated && !isAuthLoading) {
        return <Navigate to="/" replace />
    }

    if (isValidatingToken) {
        return <LoadingScreen />
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            
            {!isTokenValid || !invitation ? (
                <InvalidTokenCard />
            ) : (
                <div className="w-full max-w-md md:min-w-md min-w-full space-y-4 flex flex-col items-center relative z-10">
                    
                    <div className="text-center space-y-2">
                        <div className="flex justify-center items-center gap-2">
                            <div className="flex p-2 dark:bg-primary bg-primary-foreground rounded-lg">
                                <Logo className="size-6 fill-primary dark:fill-primary-foreground" />
                            </div>
                            <h2 className="text-2xl leading-none font-bold dark:text-primary-foreground text-primary">{t('pages.public.login.title')}</h2>
                        </div>
                    </div>

                    <div className="space-y-1 text-center w-full">
                        <h1 className="text-2xl font-semibold">{t('pages.public.register.title')}</h1>
                        <p className="text-sm text-muted-foreground">{t('pages.public.register.subtitle')}</p>
                    </div>

                    <RegisterForm token={token!} invitation={invitation} />

                    <button onClick={() => navigate('/login')} className="text-xs text-muted-foreground hover:text-foreground underline transition-colors cursor-pointer pt-2">
                        {t('pages.public.register.back_to_login')}
                    </button>

                </div>
            )}

        </div>
    )
}
