import React, { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { Building2Icon, MoreHorizontalIcon, EyeIcon, PowerOffIcon, Trash2Icon, UserIcon, ShieldCheckIcon, CopyIcon, CheckIcon } from 'lucide-react'
import { type TenantItem } from '@/types/iam'
import { Progress } from '@/components/ui/progress'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

const CopyButton: React.FC<{ text: string; label?: string }> = ({ text, label }) => {
    
    const [copied, setCopied] = useState(false)

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation()
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <button type="button" onClick={handleCopy} className="inline-flex items-center gap-1 opacity-0 group-hover/copy:opacity-100 transition-opacity text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded">
            {copied ? (<CheckIcon className="size-3 text-green-600 dark:text-green-400" />
            ) : (<CopyIcon className="size-3" />)}
        </button>
    )
}

export const getColumns = (t: (key: string, options?: Record<string, unknown>) => string): ColumnDef<TenantItem>[] => [
    {
        accessorKey: 'name',
        header: t('pages.private.platform.tenants.table.columns.name'),
        cell: ({ row }) => {
            const tenant = row.original
            return (
                <div className="flex items-center gap-2.5">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Building2Icon className="size-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-foreground text-sm">{tenant.name}</span>
                        <div className="group/copy flex items-center gap-1 text-xs text-muted-foreground">
                            <span>ID: {tenant.id.slice(0, 8)}...</span>
                            <CopyButton text={tenant.id} label={t('pages.private.platform.tenants.table.copy.id_label')} />
                        </div>
                    </div>
                </div>
            )
        },
    },
    {
        id: 'owner',
        header: t('pages.private.platform.tenants.table.columns.owner'),
        cell: ({ row }) => {
            const tenant = row.original
            const isAccepted = tenant.owner_status === 'accepted'
            const ownerDisplayName = tenant.owner_name || 'Propietario'
            const ownerEmail = tenant.owner_email || 'invitacion@empresa.com'
            return (
                <div className="flex items-center gap-2">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <UserIcon className="size-3.5" />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-foreground">{ownerDisplayName}</span>
                            {isAccepted ? (
                                <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    {t('pages.private.platform.tenants.table.owner_status.accepted')}
                                </span>
                            ) : (
                                <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    {t('pages.private.platform.tenants.table.owner_status.pending')}
                                </span>
                            )}
                        </div>
                        <div className="group/copy flex items-center gap-1 text-xs text-muted-foreground">
                            <span>{ownerEmail}</span>
                            <CopyButton text={ownerEmail} label={t('pages.private.platform.tenants.table.copy.email_label')} />
                        </div>
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: 'max_users',
        header: t('pages.private.platform.tenants.table.columns.max_users'),
        cell: ({ row }) => {
            const maxUsers = row.original.max_users || 5
            const currentUsers = 1
            const percentage = Math.min(100, Math.round((currentUsers / maxUsers) * 100))

            return (
                <div className="w-36 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">{currentUsers} de {maxUsers}</span>
                        <span className="text-muted-foreground">{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-1.5" />
                </div>
            )
        },
    },
    {
        accessorKey: 'storage_quota_gb',
        header: t('pages.private.platform.tenants.table.columns.storage_quota_gb'),
        cell: ({ row }) => {
            const quotaGb = row.original.storage_quota_gb || 10
            const usedBytes = row.original.storage_used_bytes || 0
            const usedGb = usedBytes / (1024 * 1024 * 1024)
            const percentage = Math.min(100, Math.round((usedGb / quotaGb) * 100))

            return (
                <div className="w-36 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">{usedGb.toFixed(1)} GB de {quotaGb} GB</span>
                        <span className="text-muted-foreground">{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-1.5" />
                </div>
            )
        },
    },
    {
        accessorKey: 'created_at',
        header: t('pages.private.platform.tenants.table.columns.created_at'),
        cell: ({ row }) => {
            const dateStr = row.original.created_at
            const formatted = dateStr ? new Date(dateStr).toLocaleString('es-ES', {
                dateStyle: 'short',
                timeStyle: 'short',
            }) : '-'
            return <span className="text-xs text-muted-foreground whitespace-nowrap">{formatted}</span>
        },
    },
    {
        id: 'created_by',
        header: t('pages.private.platform.tenants.table.columns.created_by'),
        cell: ({ row }) => {
            const creator = row.original.created_by
            const creatorName = creator ? `${creator.first_name} ${creator.last_name}` : 'Superusuario'
            const username = creator?.username ? `@${creator.username}` : ''

            return (
                <div className="flex items-center gap-1.5 text-xs">
                    <ShieldCheckIcon className="size-3.5 text-primary shrink-0" />
                    <div className="flex flex-col">
                        <span className="font-medium text-foreground">{creatorName}</span>
                        {username && <span className="text-[10px] text-muted-foreground">{username}</span>}
                    </div>
                </div>
            )
        },
    },
    {
        id: 'updated_at',
        header: t('pages.private.platform.tenants.table.columns.updated_at'),
        cell: ({ row }) => {
            const dateStr = row.original.updated_at || row.original.created_at
            const formatted = dateStr ? new Date(dateStr).toLocaleString('es-ES', {
                dateStyle: 'short',
                timeStyle: 'short',
            }) : '-'
            return <span className="text-xs text-muted-foreground whitespace-nowrap">{formatted}</span>
        },
    },
    {
        id: 'updated_by',
        header: t('pages.private.platform.tenants.table.columns.updated_by'),
        cell: ({ row }) => {
            const updater = row.original.updated_by || row.original.created_by
            const updaterName = updater ? `${updater.first_name} ${updater.last_name}` : 'Sistema'
            const username = updater?.username ? `@${updater.username}` : ''

            return (
                <div className="flex flex-col text-xs">
                    <span className="font-medium text-foreground">{updaterName}</span>
                    {username && <span className="text-[10px] text-muted-foreground">{username}</span>}
                </div>
            )
        },
    },
    {
        id: 'actions',
        header: '',
        cell: () => {
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button variant="ghost" size="icon-sm" className="cursor-pointer">
                                <MoreHorizontalIcon className="size-4" />
                            </Button>
                        }
                    />
                    <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuGroup>
                            <DropdownMenuLabel>{t('pages.private.platform.tenants.table.actions.title')}</DropdownMenuLabel>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 cursor-pointer">
                            <EyeIcon className="size-4" />
                            <span>{t('pages.private.platform.tenants.table.actions.view_limits')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer">
                            <PowerOffIcon className="size-4" />
                            <span>{t('pages.private.platform.tenants.table.actions.disable')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" className="gap-2 cursor-pointer">
                            <Trash2Icon className="size-4" />
                            <span>{t('pages.private.platform.tenants.table.actions.delete')}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
