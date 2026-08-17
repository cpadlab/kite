import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/auth'
import { LoginForm } from './form'
import Logo from '@/assets/logo'

export default function LoginPage() {

    const { t } = useTranslation()
    const { isAuthenticated, isLoading } = useAuth()

    if (isAuthenticated && !isLoading) {
        return <Navigate to="/" replace />
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            
            <div className="w-full max-w-md md:min-w-md min-w-full space-y-4 flex flex-col items-center relative z-10">

                <div className='text-center space-y-2'>
                    <div className='flex justify-center'>
                        <div className='flex p-2 dark:bg-transparent bg-primary-foreground rounded-lg items-center gap-2 justify-center'>
                            <Logo className="size-6 fill-primary" />
                            <h2 className="text-2xl leading-none font-bold dark:text-primary-foreground text-primary">{t('pages.public.login.title')}</h2>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">{t('pages.public.login.subtitle')}</p>
                </div>

                <div className="space-y-4 w-full">
                    <LoginForm />
                </div>

            </div>
        </div>
    )
}
