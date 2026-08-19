import React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import {
    KeyRoundIcon,
    MoreVerticalIcon,
    RefreshCwIcon,
    Trash2Icon,
    CopyIcon,
    CheckIcon,
    ActivityIcon,
    CalendarIcon,
    ShieldIcon,
    UserCheckIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/components/ui/toast'
import type { ApiKeyItem } from '@/types/iam'

interface GetColumnsProps {
    t: (key: string, options?: any) => string
    onOpenRotate: (item: ApiKeyItem) => void
    onOpenDelete: (item: ApiKeyItem) => void
}

export const getColumns = ({ t, onOpenRotate, onOpenDelete }: GetColumnsProps): ColumnDef<ApiKeyItem>[] => [
    {
        id: 'name',
        accessorKey: 'name',
        header: () => (
            <div className="flex items-center gap-1.5">
                <KeyRoundIcon className="size-3.5 text-muted-foreground" />
                <span>{t('pages.private.tenant.api_keys.table.columns.name')}</span>
            </div>
        ),
        cell: ({ row }) => {
            const item = row.original
            const [copied, setCopied] = React.useState(false)

            const handleCopyPrefix = () => {
                navigator.clipboard.writeText(item.key_prefix)
                setCopied(true)
                toast.add({
                    title: t('pages.private.tenant.api_keys.prefix_copied_toast'),
                    type: 'info',
                })
                setTimeout(() => setCopied(false), 2000)
            }

            return (
                <div className="flex items-center gap-2.5">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <KeyRoundIcon className="size-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-foreground text-sm">{item.name}</span>
                        <div className="group/copy flex items-center gap-1 text-xs text-muted-foreground">
                            <span>{item.key_prefix}...</span>
                            <Button size="icon-xs" variant="ghost" onClick={handleCopyPrefix} className="size-4 p-0.5 text-muted-foreground hover:text-foreground cursor-pointer" title="Copy Prefix">
                                {copied ? <CheckIcon className="size-3 text-emerald-500" /> : <CopyIcon className="size-3" />}
                            </Button>
                        </div>
                    </div>
                </div>
            )
        },
    },
    {
        id: 'status',
        header: () => (
            <div className="flex items-center gap-1.5">
                <ActivityIcon className="size-3.5 text-muted-foreground" />
                <span>{t('pages.private.tenant.api_keys.table.columns.status')}</span>
            </div>
        ),
        cell: ({ row }) => {
            const expiresAt = new Date(row.original.expires_at)
            const now = new Date()
            const diffDays = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 3600 * 24))
            const isActive = row.original.is_active

            if (!isActive || diffDays <= 0) {
                return (
                    <Badge variant="destructive" className="text-[11px] gap-1 font-medium">
                        <span className="size-1.5 rounded-full bg-red-400 animate-pulse" />
                        {t('pages.private.tenant.api_keys.status.expired')}
                    </Badge>
                )
            }

            if (diffDays <= 30) {
                return (
                    <Badge variant="outline" className="text-[11px] gap-1 font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                        <span className="size-1.5 rounded-full bg-amber-500" />
                        {t('pages.private.tenant.api_keys.status.expiring_soon', { days: diffDays })}
                    </Badge>
                )
            }

            return (
                <Badge variant="outline" className="text-[11px] gap-1 font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    {t('pages.private.tenant.api_keys.status.active')}
                </Badge>
            )
        },
    },
    {
        id: 'expires_at',
        accessorKey: 'expires_at',
        header: () => (
            <div className="flex items-center gap-1.5">
                <CalendarIcon className="size-3.5 text-muted-foreground" />
                <span>{t('pages.private.tenant.api_keys.table.columns.expires_at')}</span>
            </div>
        ),
        cell: ({ row }) => {
            const createdAt = new Date(row.original.created_at)
            const expiresAt = new Date(row.original.expires_at)
            const now = new Date()

            const totalDurationMs = Math.max(1, expiresAt.getTime() - createdAt.getTime())
            const remainingMs = Math.max(0, expiresAt.getTime() - now.getTime())
            const percent = Math.max(0, Math.min(100, Math.round((remainingMs / totalDurationMs) * 100)))
            const diffDays = Math.ceil(remainingMs / (1000 * 3600 * 24))

            return (
                <div className="space-y-1.5 min-w-[130px] max-w-[170px]">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">{expiresAt.toLocaleDateString()}</span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                            {diffDays > 0 ? `${diffDays}d` : '0d'}
                        </span>
                    </div>
                    <Progress value={percent} className="h-1.5" />
                </div>
            )
        },
    },
    {
        id: 'scopes',
        accessorKey: 'scopes',
        header: () => (
            <div className="flex items-center gap-1.5">
                <ShieldIcon className="size-3.5 text-muted-foreground" />
                <span>{t('pages.private.tenant.api_keys.table.columns.scopes')}</span>
            </div>
        ),
        cell: ({ row }) => {
            const scopes = row.original.scopes || []
            if (!scopes.length) {
                return <Badge variant="secondary" className="text-[11px] font-normal">{t('pages.private.tenant.api_keys.full_access')}</Badge>
            }

            const visibleScopes = scopes.slice(0, 2)
            const remainingCount = scopes.length - 2

            return (
                <div className="flex flex-wrap items-center gap-1 max-w-xs">
                    {visibleScopes.map((scope) => (
                        <Badge key={scope} variant="outline" className="text-[11px] font-mono bg-muted/40">
                            {scope}
                        </Badge>
                    ))}
                    {remainingCount > 0 && (
                        <Badge
                            variant="secondary"
                            className="text-[11px] font-mono font-semibold cursor-help"
                            title={scopes.slice(2).join(', ')}
                        >
                            +{remainingCount}
                        </Badge>
                    )}
                </div>
            )
        },
    },
    {
        id: 'created_by',
        header: () => (
            <div className="flex items-center gap-1.5">
                <UserCheckIcon className="size-3.5 text-muted-foreground" />
                <span>{t('pages.private.tenant.api_keys.table.columns.created_by')}</span>
            </div>
        ),
        cell: ({ row }) => {
            const creator = row.original.created_by
            if (!creator) return <span className="text-muted-foreground text-xs">-</span>

            return (
                <div className="space-y-0.5 text-xs">
                    <div className="font-medium text-foreground">
                        {creator.first_name} {creator.last_name}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{creator.email}</div>
                </div>
            )
        },
    },
    {
        id: 'actions',
        enableHiding: false,
        header: () => null,
        cell: ({ row }) => {
            const item = row.original

            return (
                <div className="flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger render={
                            <Button variant="ghost" size="icon-sm" className="cursor-pointer">
                                <MoreVerticalIcon className="size-4" />
                            </Button>
                        } />
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => onOpenRotate(item)} className="cursor-pointer">
                                <RefreshCwIcon />
                                {t('pages.private.tenant.api_keys.actions.rotate')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onOpenDelete(item)} variant="destructive">
                                <Trash2Icon />
                                {t('pages.private.tenant.api_keys.actions.revoke')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        },
    },
]
