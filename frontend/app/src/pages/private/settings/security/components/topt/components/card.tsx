import React from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldCheckIcon, ShieldAlertIcon, LockIcon, UnlockIcon, Loader2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TOTPCardProps {
    is2FAEnabled: boolean
    isSettingUp: boolean
    onStartSetup: () => void
    onStartDisable: () => void
}

export const TOTPCard: React.FC<TOTPCardProps> = ({ is2FAEnabled, isSettingUp, onStartSetup, onStartDisable }) => {

    const { t } = useTranslation()

    return (
        <div className="border-t pt-6 transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                <div className="flex items-start gap-4">
                    
                    <div className={`p-2 rounded-xl flex items-center justify-center shrink-0 ${is2FAEnabled ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'}`}>
                        {is2FAEnabled ? (<ShieldCheckIcon className="size-6" />
                        ) : (<ShieldAlertIcon className="size-6" />)}
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-semibold text-foreground">{t('pages.private.settings.security.totp.title')}</h3>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${is2FAEnabled ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
                                <span className={`size-1.5 rounded-full ${is2FAEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`}/>
                                {is2FAEnabled? t('pages.private.settings.security.totp.status_active'): t('pages.private.settings.security.totp.status_inactive')}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">{is2FAEnabled? t('pages.private.settings.security.totp.active_description'): t('pages.private.settings.security.totp.inactive_description')}</p>
                    </div>

                </div>

                <div className="shrink-0 flex items-center gap-3">
                    {is2FAEnabled ? (
                        <Button variant="destructive" onClick={onStartDisable} className="gap-2">
                            <UnlockIcon className="size-4" />
                            {t('pages.private.settings.security.totp.disable_button')}
                        </Button>
                    ) : (
                        <Button onClick={onStartSetup} disabled={isSettingUp} className="gap-2">
                            {isSettingUp ? (<Loader2Icon className="size-4 animate-spin" />
                            ) : (<LockIcon className="size-4" />)}
                            {t('pages.private.settings.security.totp.setup_button')}
                        </Button>
                    )}
                </div>

            </div>
        </div>
    )
}
