import React, { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

import { BackupCodesCard } from './components/card'
import { VerifyBackupDialog } from './components/modals/verify'
import { DisplayBackupDialog } from './components/modals/display-dialog'

interface BackupCodesSectionProps {
    is2FAEnabled: boolean
    isLoadingStatus?: boolean
}

export const BackupCodesSection: React.FC<BackupCodesSectionProps> = ({
    is2FAEnabled,
    isLoadingStatus = false,
}) => {
    const [isVerifyOpen, setIsVerifyOpen] = useState<boolean>(false)
    const [isCodesOpen, setIsCodesOpen] = useState<boolean>(false)
    const [retrievedCodes, setRetrievedCodes] = useState<string[]>([])

    const handleVerified = (codes: string[]) => {
        setRetrievedCodes(codes)
        setIsCodesOpen(true)
    }

    if (isLoadingStatus) {
        return (
            <div className="rounded-xl bg-card p-6 border space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-64" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                    <Skeleton className="h-9 w-28 rounded-md" />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <BackupCodesCard is2FAEnabled={is2FAEnabled} onOpenVerify={() => setIsVerifyOpen(true)} />
            <VerifyBackupDialog isOpen={isVerifyOpen} onOpenChange={setIsVerifyOpen} onVerified={handleVerified} />
            <DisplayBackupDialog isOpen={isCodesOpen} onOpenChange={setIsCodesOpen} backupCodes={retrievedCodes} />
        </div>
    )
}
