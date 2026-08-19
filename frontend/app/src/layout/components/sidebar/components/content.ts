import { LayoutDashboardIcon, LockIcon, Building2Icon, type LucideIcon, KeyRoundIcon, UsersIcon } from 'lucide-react'

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
    requiresTenantOwnerOrAdmin?: boolean;
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
        title: "layout.tenant",
        requiresTenantOwnerOrAdmin: true,
        items: [
            {
                name: "layout.api_keys",
                icon: KeyRoundIcon,
                link: "/tenant/api-keys"
            },
            {
                name: "layout.users",
                icon: UsersIcon,
                link: "/tenant/users"
            }
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