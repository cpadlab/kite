import type { ColumnDef } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { MailIcon, ShieldIcon, BanIcon, ClockIcon, KeyIcon, UserCheckIcon, ActivityIcon, CalendarIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { TenantInvitationItem } from '@/types/iam'

interface InvitationColumnsProps {
    onRevokeInvitation: (invitation: TenantInvitationItem) => void
}

export const getInvitationColumns = ({
    onRevokeInvitation,
}: InvitationColumnsProps): ColumnDef<TenantInvitationItem>[] => [
    {
        accessorKey: 'invitee',
        header: () => {
            const { t } = useTranslation()
            return (
                <div className="flex items-center gap-1.5">
                    <MailIcon className="size-3.5 text-muted-foreground" />
                    <span>{t('pages.private.tenant.users.table.columns.invitee')}</span>
                </div>
            )
        },
        cell: ({ row }) => {
            const inv = row.original
            const fullName = `${inv.first_name || ''} ${inv.last_name || ''}`.trim() || inv.email

            return (
                <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-xs border border-amber-500/20">
                        <MailIcon className="size-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-medium text-sm text-foreground truncate">
                            {fullName}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                            {inv.username && <span>@{inv.username} •</span>}
                            <span className="truncate">{inv.email}</span>
                        </div>
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: 'role',
        header: () => {
            const { t } = useTranslation()
            return (
                <div className="flex items-center gap-1.5">
                    <ShieldIcon className="size-3.5 text-muted-foreground" />
                    <span>{t('pages.private.tenant.users.table.columns.role')}</span>
                </div>
            )
        },
        cell: ({ row }) => {
            const role = (row.original.role || 'analyst').toLowerCase()
            if (role === 'admin') {
                return (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 gap-1 font-medium">
                        <ShieldIcon className="size-3" />
                        <span>Admin</span>
                    </Badge>
                )
            }
            return (
                <Badge variant="secondary" className="font-medium">
                    <span>Analyst</span>
                </Badge>
            )
        },
    },
    {
        accessorKey: 'scopes',
        header: () => {
            const { t } = useTranslation()
            return (
                <div className="flex items-center gap-1.5">
                    <KeyIcon className="size-3.5 text-muted-foreground" />
                    <span>{t('pages.private.tenant.users.table.columns.scopes')}</span>
                </div>
            )
        },
        cell: ({ row }) => {
            const scopes = row.original.scopes || []
            if (scopes.length === 0) {
                return <span className="text-xs text-muted-foreground italic">Acceso estándar</span>
            }

            const visibleScopes = scopes.slice(0, 3)
            const remainingCount = scopes.length - visibleScopes.length

            return (
                <div className="flex items-center gap-1.5 flex-wrap">
                    {visibleScopes.map((scope) => (
                        <Badge key={scope} variant="outline" className="text-xs py-0 h-5 font-mono">
                            {scope}
                        </Badge>
                    ))}
                    {remainingCount > 0 && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger render={
                                    <Badge variant="secondary" className="text-xs py-0 h-5 font-mono cursor-pointer">
                                        +{remainingCount}
                                    </Badge>
                                } />
                                <TooltipContent className="max-w-xs">
                                    <div className="flex flex-col gap-1 text-xs font-mono">
                                        {scopes.slice(3).map((s) => (
                                            <span key={s}>• {s}</span>
                                        ))}
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            )
        },
    },
    {
        accessorKey: 'invited_by',
        header: () => {
            const { t } = useTranslation()
            return (
                <div className="flex items-center gap-1.5">
                    <UserCheckIcon className="size-3.5 text-muted-foreground" />
                    <span>{t('pages.private.tenant.users.table.columns.invited_by')}</span>
                </div>
            )
        },
        cell: ({ row }) => {
            const inv = row.original
            return (
                <div className="flex flex-col text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{inv.invited_by_name || 'Admin'}</span>
                    <span className="truncate">{inv.invited_by_email}</span>
                </div>
            )
        },
    },
    {
        accessorKey: 'status',
        header: () => {
            const { t } = useTranslation()
            return (
                <div className="flex items-center gap-1.5">
                    <ActivityIcon className="size-3.5 text-muted-foreground" />
                    <span>{t('pages.private.tenant.users.table.columns.status')}</span>
                </div>
            )
        },
        cell: ({ row }) => {
            const status = row.original.status

            if (status === 'pending') {
                return (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 gap-1 text-xs font-medium">
                        <ClockIcon className="size-3" />
                        <span>Pendiente</span>
                    </Badge>
                )
            }
            if (status === 'expired') {
                return (
                    <Badge variant="secondary" className="text-xs font-medium">
                        <span>Expirada</span>
                    </Badge>
                )
            }
            return (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-xs font-medium">
                    <span>Revocada</span>
                </Badge>
            )
        },
    },
    {
        accessorKey: 'expires_at',
        header: () => {
            const { t } = useTranslation()
            return (
                <div className="flex items-center gap-1.5">
                    <CalendarIcon className="size-3.5 text-muted-foreground" />
                    <span>{t('pages.private.tenant.users.table.columns.expires_at')}</span>
                </div>
            )
        },
        cell: ({ row }) => {
            const date = new Date(row.original.expires_at)
            return (
                <span className="text-xs text-muted-foreground font-mono">
                    {date.toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                    })}
                </span>
            )
        },
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const inv = row.original
            if (inv.status !== 'pending') return null

            return (
                <Button variant="ghost" size="sm" onClick={() => onRevokeInvitation(inv)} className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer h-8 text-xs">
                    <BanIcon className="size-3.5" />
                    <span>Revocar</span>
                </Button>
            )
        },
    },
]
