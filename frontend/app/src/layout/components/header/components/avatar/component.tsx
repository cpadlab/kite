import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DATA, type DropdownItem } from "./content"
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/context/theme'
import { useAuth } from '@/context/auth'
import { NavLink } from 'react-router-dom'

export const HeaderAvatar = () => {

    const { t, i18n } = useTranslation()
    const { toggleTheme } = useTheme()
    const { logout } = useAuth()

    const handleAction = (action?: string) => {
        if (!action) return
        if (action === "toggle-theme") {
            toggleTheme()
        } else if (action === "lang-es") {
            i18n.changeLanguage("es")
        } else if (action === "lang-en") {
            i18n.changeLanguage("en")
        } else if (action === "logout") {
            logout()
        }
    }

    const renderMenuItem = (item: DropdownItem, index: number) => {
        
        const Icon = item.icon

        if (item.items && item.items.length > 0) {
            return (
                <DropdownMenuSub key={index}>
                    <DropdownMenuSubTrigger className="gap-2 cursor-pointer">
                        {Icon && <Icon className="size-4" />}
                        <span>{t(item.name)}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuContent>
                        {item.items.map((subItem, subIdx) => (
                            <DropdownMenuItem className="cursor-pointer" key={subIdx}  onClick={() => handleAction(subItem.action)}>
                                <span>{subItem.name}</span>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenuSub>
            )
        }

        if (item.action) {
            return (
                <DropdownMenuItem key={index} onClick={() => handleAction(item.action)} className="gap-2 cursor-pointer">
                    {Icon && <Icon className="size-4" />}
                    <span>{t(item.name)}</span>
                </DropdownMenuItem>
            )
        }

        return (
            <DropdownMenuItem key={index} render={<NavLink to={item.link || "#"} />} className="gap-2 cursor-pointer">
                {Icon && <Icon className="size-4" />}
                <span>{t(item.name)}</span>
            </DropdownMenuItem>
        )

    }

    return (
        <DropdownMenu>
            
            <DropdownMenuTrigger nativeButton={false} render={
                <div className="cursor-pointer flex items-center gap-2">
                    <Avatar>
                        <AvatarFallback>LK</AvatarFallback>
                        <AvatarBadge className="bg-green-600 dark:bg-green-800" />
                    </Avatar>
                    <div className="space-y-0.5 select-none">
                        <p className="text-sm leading-none font-semibold">Lyle Kauffman</p>
                        <p className="text-xs text-muted-foreground">Analyst</p>
                    </div>
                </div>
            } />

            <DropdownMenuContent className="w-56 rounded-lg" align="end">
                {DATA.map((group, groupIndex) => (
                    <span key={groupIndex}>
                        <DropdownMenuGroup>
                            {group.title && <DropdownMenuLabel>{t(group.title)}</DropdownMenuLabel>}
                            {group.items.map((item, itemIndex) => renderMenuItem(item, itemIndex))}
                        </DropdownMenuGroup>
                        {groupIndex < DATA.length - 1 && <DropdownMenuSeparator />}
                    </span>
                ))}
            </DropdownMenuContent>

        </DropdownMenu>
    )
}