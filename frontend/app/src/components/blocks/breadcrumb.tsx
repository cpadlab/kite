import React from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { HouseIcon, type LucideIcon } from "lucide-react";

export interface BreadcrumbDropdownItem {
    label: string;
    to: string;
    icon?: LucideIcon;
}

export interface PageBreadcrumbProps {
    category: {
        label: string;
        icon?: LucideIcon;
    };
    items: BreadcrumbDropdownItem[];
    current: {
        label: string;
        icon?: LucideIcon;
    };
}

export const PageBreadcrumb: React.FC<PageBreadcrumbProps> = ({ category, items, current }) => {
    
    const { t } = useTranslation();

    return (
        <Breadcrumb className="select-none">
            <BreadcrumbList>
                
                <BreadcrumbItem>
                    <BreadcrumbLink render={<Link to="/" />}>
                        <span className="flex items-center gap-1.5">
                            <HouseIcon className='size-3.5' />
                            <span>{t("layout.dashboard")}</span>
                        </span>
                    </BreadcrumbLink>
                </BreadcrumbItem>

                <BreadcrumbSeparator />

                <DropdownMenu>

                    <DropdownMenuTrigger
                        nativeButton={false}
                        render={
                            <BreadcrumbItem className="cursor-pointer">
                                <BreadcrumbLink>
                                    <span className="flex items-center gap-1.5">
                                        {category.icon && <category.icon className='size-3.5' />}
                                        <span>{t(category.label)}</span>
                                    </span>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        }
                    />

                    <DropdownMenuContent className="text-nowrap w-auto" align="start">
                        <DropdownMenuGroup>
                            {items.map((item, index) => (
                                <DropdownMenuItem key={`${item.to}-${index}`} render={<Link to={item.to} className="cursor-pointer" />}>
                                    {item.icon && <item.icon className="h-4 w-4" />}
                                    <span>{t(item.label)}</span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>
                    </DropdownMenuContent>

                </DropdownMenu>

                <BreadcrumbSeparator />

                <BreadcrumbItem className="flex items-center gap-1.5 font-medium text-muted-foreground">
                    {current.icon && <current.icon className='size-3.5' />}
                    <span>{t(current.label)}</span>
                </BreadcrumbItem>

            </BreadcrumbList>
        </Breadcrumb>
    );
};