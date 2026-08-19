import React from 'react'
import { useTranslation } from 'react-i18next'
import type { Table as ReactTable } from '@tanstack/react-table'
import { SearchIcon, SlidersHorizontalIcon, UserPlusIcon, CrownIcon, XIcon, UsersIcon, MailIcon } from 'lucide-react'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupButton } from '@/components/ui/input-group'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OrderSelect } from './order'
import { Separator } from '@/components/ui/separator'

interface TableToolbarProps<TData> {
    table: ReactTable<TData>
    search: string
    onSearchChange: (search: string) => void
    sortOrder: 'asc' | 'desc'
    onSortOrderChange: (order: 'asc' | 'desc') => void
    activeTab: 'members' | 'invitations'
    onTabChange: (tab: 'members' | 'invitations') => void
    membersCount: number
    invitationsCount: number
    isOwner: boolean
    onOpenInvite: () => void
    onOpenTransferOwnership: () => void
}

export function TableToolbar<TData>({
    table,
    search,
    onSearchChange,
    sortOrder,
    onSortOrderChange,
    activeTab,
    onTabChange,
    membersCount,
    invitationsCount,
    isOwner,
    onOpenInvite,
    onOpenTransferOwnership,
}: TableToolbarProps<TData>) {
    const { t } = useTranslation()

    return (
        <div className="flex flex-col gap-4">

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">

                <div className='flex items-center gap-2'>
                    
                    <div className="w-full sm:w-80">
                        <InputGroup>
                            <InputGroupAddon align="inline-start">
                                <SearchIcon className="size-4 text-muted-foreground" />
                            </InputGroupAddon>
                            <InputGroupInput
                                placeholder={
                                    activeTab === 'members'
                                        ? t('pages.private.tenant.users.toolbar.search_placeholder')
                                        : t('pages.private.tenant.users.toolbar.search_invitations_placeholder')
                                }
                                value={search}
                                onChange={(e) => onSearchChange(e.target.value)}
                            />
                            {search && (
                                <InputGroupAddon align="inline-end">
                                    <InputGroupButton onClick={() => onSearchChange('')} size="icon-xs">
                                        <XIcon className="size-3.5" />
                                    </InputGroupButton>
                                </InputGroupAddon>
                            )}
                        </InputGroup>
                    </div>

                        <Tabs value={activeTab} onValueChange={(val) => onTabChange(val as 'members' | 'invitations')}>
                        <TabsList>
                            <TabsTrigger value="members" className="gap-2 text-xs font-medium cursor-pointer">
                                <UsersIcon className="size-3.5" />
                                <span>{t('pages.private.tenant.users.tabs.members')}</span>
                                <span className="ml-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold px-2 py-0.5">
                                    {membersCount}
                                </span>
                            </TabsTrigger>

                            <TabsTrigger value="invitations" className="gap-2 text-xs font-medium cursor-pointer">
                                <MailIcon className="size-3.5" />
                                <span>{t('pages.private.tenant.users.tabs.invitations')}</span>
                                {invitationsCount > 0 && (
                                    <span className="ml-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-semibold px-2 py-0.5">
                                        {invitationsCount}
                                    </span>
                                )}
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

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

                        <DropdownMenuContent align="end" className="w-52">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => {
                                    const label = t(
                                        `pages.private.tenant.users.table.columns.${column.id}`,
                                        column.id
                                    )
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize cursor-pointer text-xs"
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

                    {isOwner && (
                        <Button variant="outline" onClick={onOpenTransferOwnership}>
                            <CrownIcon className="size-4" />
                            <span className="hidden sm:inline">
                                {t('pages.private.tenant.users.toolbar.transfer_ownership_button')}
                            </span>
                        </Button>
                    )}

                    <Button onClick={onOpenInvite}>
                        <UserPlusIcon className="size-4" />
                        <span>{t('pages.private.tenant.users.toolbar.invite_button')}</span>
                    </Button>

                </div>

            </div>
        </div>
    )
}
