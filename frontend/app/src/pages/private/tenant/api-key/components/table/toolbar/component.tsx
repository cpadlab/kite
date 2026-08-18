import React from 'react'
import { useTranslation } from 'react-i18next'
import type { Table as ReactTable } from '@tanstack/react-table'
import { SearchIcon, SlidersHorizontalIcon, PlusIcon, XIcon } from 'lucide-react'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupButton } from '@/components/ui/input-group'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { OrderSelect } from './order'
import type { ApiKeyItem } from '@/types/iam'

interface TableToolbarProps {
    table: ReactTable<ApiKeyItem>
    search: string
    onSearchChange: (search: string) => void
    sortOrder: 'asc' | 'desc'
    onSortOrderChange: (order: 'asc' | 'desc') => void
    onOpenCreate: () => void
}

export const TableToolbar: React.FC<TableToolbarProps> = ({
    table,
    search,
    onSearchChange,
    sortOrder,
    onSortOrderChange,
    onOpenCreate,
}) => {

    const { t } = useTranslation()

    return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            <div className="w-full sm:w-72">
                <InputGroup>
                    <InputGroupAddon align="inline-start">
                        <SearchIcon className="size-4 text-muted-foreground" />
                    </InputGroupAddon>
                    <InputGroupInput placeholder={t('pages.private.tenant.api_keys.toolbar.search_placeholder')} value={search} onChange={(e) => onSearchChange(e.target.value)} />
                    {search && (
                        <InputGroupAddon align="inline-end">
                            <InputGroupButton onClick={() => onSearchChange('')} size="icon-xs">
                                <XIcon className="size-3.5" />
                            </InputGroupButton>
                        </InputGroupAddon>
                    )}
                </InputGroup>
            </div>

            <div className="flex items-center gap-2 justify-end">
                
                <OrderSelect sortOrder={sortOrder} onSortOrderChange={onSortOrderChange} />

                <DropdownMenu>
                    
                    <DropdownMenuTrigger
                        render={
                            <Button variant="outline" size="sm" className="gap-2 cursor-pointer h-8">
                                <SlidersHorizontalIcon className="size-4" />
                                <span className="hidden sm:inline">
                                    {t('pages.private.tenant.api_keys.table.columns_button')}
                                </span>
                            </Button>
                        }
                    />
                    
                    <DropdownMenuContent align="end" className="w-48">
                        {table.getAllColumns().filter((column) => column.getCanHide()).map((column) => {
                                const label = t(`pages.private.tenant.api_keys.table.columns.${column.id}`, column.id)
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize cursor-pointer"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                    >
                                        {label}
                                    </DropdownMenuCheckboxItem>
                                )
                            })}
                    </DropdownMenuContent>

                </DropdownMenu>

                <Separator orientation="vertical" className="mx-2" />

                <Button onClick={onOpenCreate}>
                    <PlusIcon className="size-4" />
                    <span>{t('pages.private.tenant.api_keys.toolbar.create_button')}</span>
                </Button>

            </div>
        </div>
    )
}
