import React from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowDownAZIcon, ArrowUpAZIcon, ListOrderedIcon } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface OrderSelectProps {
    sortOrder: 'asc' | 'desc'
    onSortOrderChange: (order: 'asc' | 'desc') => void
}

export const OrderSelect: React.FC<OrderSelectProps> = ({
    sortOrder,
    onSortOrderChange,
}) => {
    
    const { t } = useTranslation()

    return (
        <DropdownMenu>
            
            <DropdownMenuTrigger
                render={
                    <Button variant="outline" size="sm" className="gap-2 cursor-pointer h-8">
                        <ListOrderedIcon className="size-4" />
                        <span className="hidden sm:inline">
                            {sortOrder === 'desc'
                                ? t('pages.private.platform.tenants.table.sort_recent')
                                : t('pages.private.platform.tenants.table.sort_oldest')}
                        </span>
                    </Button>
                }
            />

            <DropdownMenuContent align="end" className="w-auto">
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => onSortOrderChange('desc')}>
                    <ArrowDownAZIcon className="size-4" />
                    <span>{t('pages.private.platform.tenants.table.sort_recent_desc')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => onSortOrderChange('asc')}>
                    <ArrowUpAZIcon className="size-4" />
                    <span>{t('pages.private.platform.tenants.table.sort_oldest_asc')}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>

        </DropdownMenu>
    )
}
