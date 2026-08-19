import React, { useState, useMemo } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { useReactTable, getCoreRowModel, flexRender, type VisibilityState, type ColumnDef } from '@tanstack/react-table'
import { ChevronLeftIcon, ChevronRightIcon, UsersIcon, MailIcon } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getMemberColumns } from '../columns/members'
import { getInvitationColumns } from '../columns/invitations'
import { TableToolbar } from './toolbar/component'
import type { TenantMemberItem, TenantInvitationItem } from '@/types/iam'

interface UsersTableProps {
    activeTab: 'members' | 'invitations'
    onTabChange: (tab: 'members' | 'invitations') => void
    members: TenantMemberItem[]
    invitations: TenantInvitationItem[]
    isLoading: boolean
    total: number
    page: number
    pageSize: number
    totalPages: number
    search: string
    onSearchChange: (search: string) => void
    sortOrder: 'asc' | 'desc'
    onSortOrderChange: (order: 'asc' | 'desc') => void
    onPageChange: (page: number) => void
    currentUserRole?: string
    currentUserId?: string
    onOpenInvite: () => void
    onOpenTransferOwnership: () => void
    onEditRole: (member: TenantMemberItem) => void
    onEditScopes: (member: TenantMemberItem) => void
    onToggleStatus: (member: TenantMemberItem) => void
    onRemoveMember: (member: TenantMemberItem) => void
    onTransferOwnership: (member: TenantMemberItem) => void
    onRevokeInvitation: (invitation: TenantInvitationItem) => void
}

export const UsersTable: React.FC<UsersTableProps> = ({
    activeTab,
    onTabChange,
    members,
    invitations,
    isLoading,
    total,
    page,
    totalPages,
    search,
    onSearchChange,
    sortOrder,
    onSortOrderChange,
    onPageChange,
    currentUserRole,
    currentUserId,
    onOpenInvite,
    onOpenTransferOwnership,
    onEditRole,
    onEditScopes,
    onToggleStatus,
    onRemoveMember,
    onTransferOwnership,
    onRevokeInvitation,
}) => {

    const { t } = useTranslation()
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

    const isOwner = (currentUserRole || '').toLowerCase() === 'owner'

    const memberColumns = useMemo(
        () =>
            getMemberColumns({
                currentUserRole,
                currentUserId,
                onEditRole,
                onEditScopes,
                onToggleStatus,
                onRemoveMember,
                onTransferOwnership,
            }),
        [currentUserRole, currentUserId, onEditRole, onEditScopes, onToggleStatus, onRemoveMember, onTransferOwnership]
    )

    const invitationColumns = useMemo(
        () => getInvitationColumns({ onRevokeInvitation }),
        [onRevokeInvitation]
    )

    const currentData = (activeTab === 'members' ? members : invitations) as any[]
    const currentColumns = (activeTab === 'members' ? memberColumns : invitationColumns) as ColumnDef<any>[]

    const table = useReactTable<any>({
        data: currentData,
        columns: currentColumns,
        state: {
            columnVisibility,
        },
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <div className="space-y-4">

            <TableToolbar table={table} search={search} onSearchChange={onSearchChange} sortOrder={sortOrder} onSortOrderChange={onSortOrderChange} activeTab={activeTab} onTabChange={onTabChange} membersCount={activeTab === 'members' ? total : members.length} invitationsCount={activeTab === 'invitations' ? total : invitations.length} isOwner={isOwner} onOpenInvite={onOpenInvite} onOpenTransferOwnership={onOpenTransferOwnership} />

            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
                <Table>

                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, idx) => (
                                <TableRow key={idx}>
                                    <TableCell colSpan={currentColumns.length} className="py-4">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="size-9 rounded-full" />
                                            <div className="space-y-1">
                                                <Skeleton className="h-4 w-44" />
                                                <Skeleton className="h-3 w-28" />
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={currentColumns.length} className="h-40 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                        {activeTab === 'members' ? (
                                            <UsersIcon className="size-8 stroke-1 text-muted-foreground/60" />
                                        ) : (
                                            <MailIcon className="size-8 stroke-1 text-muted-foreground/60" />
                                        )}
                                        <span className="text-sm font-medium">
                                            {activeTab === 'members' ? t('pages.private.tenant.users.table.empty_members') : t('pages.private.tenant.users.table.empty_invitations')}
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>

                </Table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 text-xs text-muted-foreground">
                
                <div>
                    <Trans i18nKey="pages.private.tenant.users.table.showing_info" values={{ showing: currentData.length, total }}
                        components={{
                            1: <span className="font-semibold text-foreground" />,
                            3: <span className="font-semibold text-foreground" />,
                        }} />
                </div>

                <div className="flex items-center gap-2">
                    
                    <span className="mr-2">
                        <Trans i18nKey="pages.private.tenant.users.table.page_info" values={{ page, totalPages: totalPages || 1 }}
                            components={{
                                1: <span className="font-medium text-foreground" />,
                                3: <span className="font-medium text-foreground" />,
                            }} />
                    </span>

                    <Button variant="outline" size="icon-xs" onClick={() => onPageChange(page - 1)} disabled={page <= 1 || isLoading} className="cursor-pointer" >
                        <ChevronLeftIcon />
                    </Button>
                    <Button variant="outline" size="icon-xs" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages || isLoading} className="cursor-pointer" >
                        <ChevronRightIcon />
                    </Button>

                </div>

            </div>

        </div>
    )
}
