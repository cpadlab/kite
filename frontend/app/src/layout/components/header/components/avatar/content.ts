import { UserIcon, BellIcon, SettingsIcon, SunMoonIcon, LanguagesIcon, LifeBuoyIcon, LogOutIcon,type LucideIcon, BookOpenTextIcon, AlertCircleIcon, CodeXmlIcon } from 'lucide-react'

export interface DropdownSubItem {
    name: string;
    link?: string;
    action?: string;
    icon?: LucideIcon;
}

export interface DropdownItem {
    name: string;
    link?: string;
    icon?: LucideIcon;
    action?: string;
    items?: DropdownSubItem[];
}

export interface DropdownGroupSection {
    title?: string;
    items: DropdownItem[];
}

export const DATA: DropdownGroupSection[] = [
    {
        title: "layout.my_account",
        items: [
            {
                name: "layout.profile",
                link: "/profile",
                icon: UserIcon
            },
            {
                name: "layout.notifications",
                link: "/notifications",
                icon: BellIcon
            }
        ]
    },
    {
        title: "layout.developer_group",
        items: [
            {
                name: "layout.graphql_query",
                action: "open-graphql-editor",
                icon: CodeXmlIcon
            }
        ]
    },
    {
        title: "layout.preferences_group",
        items: [
            {
                name: "layout.settings",
                link: "/settings/preferences",
                icon: SettingsIcon
            },
            {
                name: "layout.toggleTheme",
                action: "toggle-theme",
                icon: SunMoonIcon
            },
            {
                name: "layout.language",
                icon: LanguagesIcon,
                items: [
                    { 
                        name: "Español", 
                        action: "lang-es" 
                    },
                    { 
                        name: "English", 
                        action: "lang-en" 
                    }
                ]
            }
        ]
    },
    {
        title: "layout.support_group",
        items: [
            {
                name: "layout.support",
                link: "/support/portal",
                icon: LifeBuoyIcon
            },
            {
                name: "layout.documentation",
                link: "/support/documentation",
                icon: BookOpenTextIcon
            },
            {
                name: "layout.issues",
                link: "/support/issues",
                icon: AlertCircleIcon
            }
        ]
    },
    {
        items: [
            {
                name: "layout.logout",
                action: "logout",
                icon: LogOutIcon
            }
        ]
    }
]