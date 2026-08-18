import React from 'react'
import { useTranslation } from 'react-i18next'
import { KeyRoundIcon, LockIcon, TriangleAlertIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BackupCodesCardProps {
    is2FAEnabled: boolean
    onOpenVerify: () => void
}

export const BackupCodesCard: React.FC<BackupCodesCardProps> = ({
    is2FAEnabled,
    onOpenVerify,
}) => {
    const { t } = useTranslation()

    return (
        <div className="transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                <div className="flex items-start gap-4">
                    
                    <div className={`p-2 rounded-xl flex items-center justify-center shrink-0 ${ is2FAEnabled ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-destructive/15 text-destructive border border-destructive/30'}`}>
                        {is2FAEnabled ? (<KeyRoundIcon className="size-6" />
                        ) : (<TriangleAlertIcon className="size-6" />)}
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-semibold text-foreground">{t('pages.private.settings.security.backup_codes.title')}</h3>
                            {!is2FAEnabled && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/15 text-destructive">
                                    <span className="size-1.5 rounded-full bg-destructive animate-pulse" />
                                    {t('pages.private.settings.security.totp.status_inactive')}
                                </span>
                            )}
                        </div>
                        <p className={`text-sm leading-relaxed max-w-2xl ${is2FAEnabled? 'text-muted-foreground' : 'text-destructive/90'}`}>{is2FAEnabled ? t('pages.private.settings.security.backup_codes.description') : t('pages.private.settings.security.backup_codes.not_enabled')}</p>
                    </div>

                </div>

                <div className="shrink-0 flex items-center gap-3">
                    <Button onClick={onOpenVerify} disabled={!is2FAEnabled} variant={is2FAEnabled ? 'outline' : 'secondary'}>
                        <LockIcon className="size-4" />
                        {t('pages.private.settings.security.backup_codes.view_button')}
                    </Button>
                </div>

            </div>
        </div>
    )
}
