import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShieldAlertIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Logo from '@/assets/logo'

export const InvalidTokenCard: React.FC = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()

    return (
        <div className="w-full max-w-md md:min-w-md min-w-full space-y-6 flex flex-col items-center relative z-10">
            
            <div className="text-center space-y-2">
                <div className="flex justify-center items-center gap-2">
                    <div className="flex p-2 dark:bg-primary bg-primary-foreground rounded-lg">
                        <Logo className="size-6 fill-primary dark:fill-primary-foreground" />
                    </div>
                    <h2 className="text-2xl leading-none font-bold dark:text-primary-foreground text-primary">
                        {t('pages.public.login.title')}
                    </h2>
                </div>
            </div>

            <div className="w-full rounded-2xl bg-card text-center space-y-4">
                
                <div className="space-y-1">
                    <h1 className="text-xl font-semibold text-foreground">{t('pages.public.register.invalid_token_title')}</h1>
                    <p className="text-sm text-muted-foreground leading-relaxed">{t('pages.public.register.invalid_token_desc')}</p>
                </div>

                <Button onClick={() => navigate('/login')} className="w-full cursor-pointer mt-2">
                    {t('pages.public.register.back_to_login')}
                </Button>

            </div>
        </div>
    )
}
