import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyRoundIcon, CopyIcon, CheckIcon, DownloadIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'

interface DisplayBackupDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    backupCodes: string[]
}

export const DisplayBackupDialog: React.FC<DisplayBackupDialogProps> = ({
    isOpen,
    onOpenChange,
    backupCodes,
}) => {
    const { t } = useTranslation()
    const [copiedBackupCodes, setCopiedBackupCodes] = useState<boolean>(false)

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopiedBackupCodes(true)
        setTimeout(() => setCopiedBackupCodes(false), 2000)
    }

    const downloadBackupCodes = () => {
        const content =
            `KITE SECURITY BACKUP CODES\n==========================\n\nKeep these codes in a safe place.\n\n` +
            backupCodes.join('\n') +
            '\n'
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'kite-2fa-backup-codes.txt'
        link.click()
        URL.revokeObjectURL(url)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <KeyRoundIcon className="size-5 text-primary" />
                        {t('pages.private.settings.security.backup_codes.codes_modal_title')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('pages.private.settings.security.backup_codes.codes_modal_desc')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-muted/60 p-4 rounded-xl border font-mono text-xs text-center font-medium">
                        {backupCodes.map((code, idx) => (
                            <span key={idx} className="bg-background py-1.5 px-2 rounded-md border select-all text-foreground">
                                {code}
                            </span>
                        ))}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => copyToClipboard(backupCodes.join('\n'))}>
                            {copiedBackupCodes ? (<CheckIcon className="size-3.5 text-emerald-500" />
                            ) : (<CopyIcon className="size-3.5" />)}
                            {t('pages.private.settings.security.totp.copy_backup_codes')}
                        </Button>
                        <Button type="button" onClick={downloadBackupCodes}>
                            <DownloadIcon className="size-3.5" />
                            {t('pages.private.settings.security.totp.download_backup_codes')}
                        </Button>
                    </DialogFooter>

                </div>

            </DialogContent>
        </Dialog>
    )
}
