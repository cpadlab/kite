import { AstroidIcon, BellIcon, FileIcon, FunnelXIcon, HammerIcon, LayoutDashboardIcon, MonitorIcon, ShieldAlertIcon, ShieldIcon, SlidersHorizontalIcon, SquareStackIcon, UsersRoundIcon,CloudIcon,FlameIcon,SearchIcon,WorkflowIcon,CalendarIcon,HistoryIcon,FolderCogIcon,BoxesIcon,PuzzleIcon,StoreIcon,SettingsIcon,UserCircleIcon,PaletteIcon,LockIcon,KeyRoundIcon,LifeBuoyIcon,CodeXmlIcon,BookOpenTextIcon,MegaphoneIcon,AlertCircleIcon,FileTextIcon,ScaleIcon,type LucideIcon } from 'lucide-react'

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