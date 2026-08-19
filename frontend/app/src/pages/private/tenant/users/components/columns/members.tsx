import type { ColumnDef } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { MoreHorizontalIcon, ShieldIcon, ShieldCheckIcon, ShieldAlertIcon, KeyIcon, UserCheckIcon, UserXIcon, UserMinusIcon, CrownIcon, UserIcon, ActivityIcon, ClockIcon, CalendarIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { TenantMemberItem } from '@/types/iam'

interface MemberColumnsProps {
    currentUserRole?: string
    currentUserId?: string
    onEditRole: (member: TenantMemberItem) => void
    onEditScopes: (member: TenantMemberItem) => void
    onToggleStatus: (member: TenantMemberItem) => void
    onRemoveMember: (member: TenantMemberItem) => void
    onTransferOwnership: (member: TenantMemberItem) => void
}

export const getMemberColumns = ({
    currentUserRole,
    currentUserId,
    onEditRole,
    onEditScopes,
    onToggleStatus,
    onRemoveMember,
    onTransferOwnership,
}: MemberColumnsProps): ColumnDef<TenantMemberItem>[] => {
    
    const isAnalyst = (currentUserRole || '').toLowerCase() === 'analyst'

    const allColumns: ColumnDef<TenantMemberItem>[] = [
        {
            accessorKey: 'user',
            header: () => {
                const { t } = useTranslation()
                return (
                    <div className="flex items-center gap-1.5">
                        <UserIcon className="size-3.5 text-muted-foreground" />
                        <span>{t('pages.private.tenant.users.table.columns.user')}</span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const member = row.original
                const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.username
                const initials = `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`.toUpperCase() || 'U'

                return (
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
                            {initials !== 'U' ? initials : <UserIcon className="size-4" />}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-medium text-sm text-foreground truncate">
                                {fullName}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                                <span>@{member.username}</span>
                                <span>•</span>
                                <span className="truncate">{member.email}</span>
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
                        <CrownIcon className="size-3.5 text-muted-foreground" />
                        <span>{t('pages.private.tenant.users.table.columns.role')}</span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const role = (row.original.role || 'analyst').toLowerCase()

                if (role === 'owner') {
                    return (
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 gap-1.5 font-medium">
                            <CrownIcon className="size-3 text-purple-600 dark:text-purple-400" />
                            <span>Owner</span>
                        </Badge>
                    )
                }
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
                const isActive = row.original.is_active

                return (
                    <div className="flex items-center gap-2">
                        <span
                            className={`size-2 rounded-full ${
                                isActive ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50' : 'bg-destructive shadow-xs shadow-destructive/50'
                            }`}
                        />
                        <span className="text-xs font-medium text-foreground">
                            {isActive ? 'Activo' : 'Deshabilitado'}
                        </span>
                    </div>
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
                    return <span className="text-xs text-muted-foreground italic">Sin scopes</span>
                }

                if (scopes.includes('*')) {
                    return (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs">
                            Full Access (*)
                        </Badge>
                    )
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
            accessorKey: 'totp',
            header: () => {
                const { t } = useTranslation()
                return (
                    <div className="flex items-center gap-1.5">
                        <ShieldCheckIcon className="size-3.5 text-muted-foreground" />
                        <span>{t('pages.private.tenant.users.table.columns.totp')}</span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const is2FA = row.original.is_2fa_enabled
                if (is2FA) {
                    return (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1 text-xs font-medium">
                            <ShieldCheckIcon className="size-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Activo</span>
                        </Badge>
                    )
                }
                return (
                    <Badge variant="secondary" className="gap-1 text-xs font-medium opacity-75">
                        <ShieldAlertIcon className="size-3" />
                        <span>Inactivo</span>
                    </Badge>
                )
            },
        },
        {
            accessorKey: 'last_login_at',
            header: () => {
                const { t } = useTranslation()
                return (
                    <div className="flex items-center gap-1.5">
                        <ClockIcon className="size-3.5 text-muted-foreground" />
                        <span>{t('pages.private.tenant.users.table.columns.last_login_at')}</span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const lastLogin = row.original.last_login_at
                if (!lastLogin) {
                    return <span className="text-xs text-muted-foreground italic">Nunca</span>
                }
                const date = new Date(lastLogin)
                return (
                    <span className="text-xs text-muted-foreground font-mono">
                        {date.toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                        })}{' '}
                        {date.toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </span>
                )
            },
        },
        {
            accessorKey: 'created_at',
            header: () => {
                const { t } = useTranslation()
                return (
                    <div className="flex items-center gap-1.5">
                        <CalendarIcon className="size-3.5 text-muted-foreground" />
                        <span>{t('pages.private.tenant.users.table.columns.created_at')}</span>
                    </div>
                )
            },
            cell: ({ row }) => {
                const date = new Date(row.original.created_at)
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
                const { t } = useTranslation()
                const member = row.original
                const targetRole = (member.role || '').toLowerCase()
                const isOwner = targetRole === 'owner'
                const isSelf = currentUserId ? member.id === currentUserId : false
                const isActorOwner = (currentUserRole || '').toLowerCase() === 'owner'
                const isActorAdmin = (currentUserRole || '').toLowerCase() === 'admin'

                const canEditRole = !isOwner && (isActorOwner || (isActorAdmin && targetRole !== 'admin'))
                const canEditScopes = !isOwner && (isActorOwner || (isActorAdmin && targetRole !== 'admin'))
                const canToggleStatus = !isOwner && !isSelf && (isActorOwner || (isActorAdmin && targetRole !== 'admin'))
                const canTransfer = isActorOwner && !isOwner
                const canRemove = !isOwner && !isSelf && (isActorOwner || (isActorAdmin && targetRole !== 'admin'))

                const hasAnyAction = canEditRole || canEditScopes || canToggleStatus || canTransfer || canRemove

                if (!hasAnyAction) {
                    return null
                }

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger render={
                            <Button variant="ghost" size="icon-xs" className="size-8 cursor-pointer">
                                <MoreHorizontalIcon className="size-4" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        } />
                        <DropdownMenuContent align="end" className="w-52">
                            {canEditRole && (
                                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => onEditRole(member)}>
                                    <ShieldIcon className="size-4 text-muted-foreground" />
                                    <span>{t('pages.private.tenant.users.actions.edit_role')}</span>
                                </DropdownMenuItem>
                            )}

                            {canEditScopes && (
                                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => onEditScopes(member)}>
                                    <KeyIcon className="size-4 text-muted-foreground" />
                                    <span>{t('pages.private.tenant.users.actions.edit_scopes')}</span>
                                </DropdownMenuItem>
                            )}

                            {(canEditRole || canEditScopes) && (canToggleStatus || canTransfer || canRemove) && (
                                <DropdownMenuSeparator />
                            )}

                            {canToggleStatus && (
                                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => onToggleStatus(member)}>
                                    {member.is_active ? (
                                        <>
                                            <UserXIcon className="size-4 text-amber-500" />
                                            <span className="text-amber-600 dark:text-amber-400">
                                                {t('pages.private.tenant.users.actions.disable')}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <UserCheckIcon className="size-4 text-emerald-500" />
                                            <span className="text-emerald-600 dark:text-emerald-400">
                                                {t('pages.private.tenant.users.actions.enable')}
                                            </span>
                                        </>
                                    )}
                                </DropdownMenuItem>
                            )}

                            {canTransfer && (
                                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => onTransferOwnership(member)}>
                                    <CrownIcon className="size-4 text-purple-500" />
                                    <span className="text-purple-600 dark:text-purple-400">
                                        {t('pages.private.tenant.users.actions.transfer')}
                                    </span>
                                </DropdownMenuItem>
                            )}

                            {canRemove && (
                                <>
                                    {(canToggleStatus || canTransfer) && <DropdownMenuSeparator />}
                                    <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive" onClick={() => onRemoveMember(member)}>
                                        <UserMinusIcon className="size-4" />
                                        <span>{t('pages.private.tenant.users.actions.remove')}</span>
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]

    if (isAnalyst) {
        return allColumns.filter((col) => col.id === 'user' || (col as any).accessorKey === 'user' || (col as any).accessorKey === 'role')
    }

    return allColumns
    
}
