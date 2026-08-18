import { LayoutDashboardIcon, LockIcon, Building2Icon, type LucideIcon } from 'lucide-react'

export interface SidebarSubItem {
    name: string;
    link: string;
    icon?: LucideIcon;
}

export interface SidebarItem {
    name: string;
    icon?: LucideIcon;
    link?: string;
    isActive?: boolean;
    items?: SidebarSubItem[];
}

export interface SidebarGroupSection {
    title?: string;
    requiresSuperuser?: boolean;
    items: SidebarItem[];
}

export const DATA: SidebarGroupSection[] = [
    {
        title: "layout.home",
        items: [
            {
                name: "layout.dashboard",
                icon: LayoutDashboardIcon,
                link: "/"
            },
        ]
    },
    {
        title: "layout.platform",
        requiresSuperuser: true,
        items: [
            {
                name: "layout.tenants",
                icon: Building2Icon,
                link: "/platform/tenants"
            },
        ]
    },
    {
        title: "layout.settings",
        items: [
            {
                name: "layout.security",
                icon: LockIcon,
                link: "/settings/security"
            }
        ]
    }
]