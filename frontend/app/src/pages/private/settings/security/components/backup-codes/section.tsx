import React, { useState } from 'react'

import { BackupCodesCard } from './components/card'
import { VerifyBackupDialog } from './components/modals/verify'
import { DisplayBackupDialog } from './components/modals/display-dialog'

interface BackupCodesSectionProps {
    is2FAEnabled: boolean
}

export const BackupCodesSection: React.FC<BackupCodesSectionProps> = ({ is2FAEnabled }) => {
    
    const [isVerifyOpen, setIsVerifyOpen] = useState<boolean>(false)
    const [isCodesOpen, setIsCodesOpen] = useState<boolean>(false)
    const [retrievedCodes, setRetrievedCodes] = useState<string[]>([])

    const handleVerified = (codes: string[]) => {
        setRetrievedCodes(codes)
        setIsCodesOpen(true)
    }

    return (
        <div className="space-y-6">
            <BackupCodesCard is2FAEnabled={is2FAEnabled} onOpenVerify={() => setIsVerifyOpen(true)} />
            <VerifyBackupDialog isOpen={isVerifyOpen} onOpenChange={setIsVerifyOpen} onVerified={handleVerified} />
            <DisplayBackupDialog isOpen={isCodesOpen} onOpenChange={setIsCodesOpen} backupCodes={retrievedCodes} />
        </div>
    )
}
