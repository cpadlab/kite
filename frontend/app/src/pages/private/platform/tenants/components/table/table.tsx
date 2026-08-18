import React, { useState, useMemo } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { useReactTable, getCoreRowModel, flexRender, type VisibilityState } from '@tanstack/react-table'
import { ChevronLeftIcon, ChevronRightIcon, Building2Icon } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getColumns } from './columns'
import { TableToolbar } from './toolbar/component'
import type { TenantItem } from '@/types/iam'

interface TenantsTableProps {
    data: TenantItem[]
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
    onOpenCreate: () => void
}

export const TenantsTable: React.FC<TenantsTableProps> = ({
    data,
    isLoading,
    total,
    page,
    pageSize,
    totalPages,
    search,
    onSearchChange,
    sortOrder,
    onSortOrderChange,
    onPageChange,
    onOpenCreate,
}) => {
    const { t } = useTranslation()
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

    const columns = useMemo(() => getColumns(t), [t])

    const table = useReactTable({
        data,
        columns,
        state: {
            columnVisibility,
        },
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <div className="space-y-4">
            
            <TableToolbar table={table} search={search} onSearchChange={onSearchChange} sortOrder={sortOrder} onSortOrderChange={onSortOrderChange} onOpenCreate={onOpenCreate} />

            <div className="overflow-hidden rounded-xl border bg-card">
                <Table>

                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, idx) => (
                                <TableRow key={idx}>
                                    <TableCell colSpan={columns.length} className="py-4">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="size-8 rounded-lg" />
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
                                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-40 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                        <Building2Icon className="size-8 stroke-1 text-muted-foreground/60" />
                                        <span className="text-sm font-medium">
                                            {t('pages.private.platform.tenants.table.empty_state')}
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
                    <Trans i18nKey="pages.private.platform.tenants.table.showing_info" values={{ showing: data.length, total }}
                        components={{
                            1: <span className="font-semibold text-foreground" />,
                            3: <span className="font-semibold text-foreground" />,
                        }} />
                </div>

                <div className="flex items-center gap-2">
                    
                    <span className="mr-2">
                        <Trans i18nKey="pages.private.platform.tenants.table.page_info" values={{ page, totalPages: totalPages || 1 }}
                            components={{
                                1: <span className="font-medium text-foreground" />,
                                3: <span className="font-medium text-foreground" />,
                            }} />
                    </span>

                    <Button variant="outline" size="icon-xs" onClick={() => onPageChange(page - 1)} disabled={page <= 1 || isLoading} className="cursor-pointer" >
                        <ChevronLeftIcon />
                    </Button>
                    <Button variant="outline" size="icon-xs" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages || isLoading} className="cursor-pointer">
                        <ChevronRightIcon />
                    </Button>

                </div>

            </div>
        </div>
    )
}
