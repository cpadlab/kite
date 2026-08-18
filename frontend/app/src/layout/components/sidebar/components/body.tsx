import { SidebarContent } from '@/components/ui/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from "@/components/ui/sidebar"
import { ChevronRight } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/auth'
import { DATA } from './content'

export const Body = () => {
    
    const { t } = useTranslation()
    const { user } = useAuth()

    const filteredData = DATA.filter((group) => {
        if (group.requiresSuperuser && !user?.isSuperuser) {
            return false
        }
        return true
    })

    return (
        <SidebarContent className='relative'>
            {filteredData.map((group, groupIdx) => (
                <SidebarGroup key={groupIdx}>
                    {group.title && <SidebarGroupLabel>{t(group.title)}</SidebarGroupLabel>}
                    
                    <SidebarMenu>
                        {group.items.map((item) => {
                            if (item.items && item.items.length > 0) {
                                return (
                                    <Collapsible key={t(item.name)} defaultOpen={item.isActive} className="group/collapsible">
                                        <SidebarMenuItem>
                                            
                                            <CollapsibleTrigger 
                                                render={
                                                    <SidebarMenuButton tooltip={t(item.name)} className="w-full justify-between">
                                                        {item.icon && <item.icon />}
                                                        <span className="flex-1 text-left group-data-[collapsible=icon]:hidden">{t(item.name)}</span>
                                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                                                    </SidebarMenuButton>
                                                } 
                                            />

                                            <CollapsibleContent>
                                                <SidebarMenuSub>
                                                    {item.items.map((subItem) => (
                                                        <SidebarMenuSubItem key={t(subItem.name)}>
                                                            <SidebarMenuSubButton render={<NavLink to={subItem.link} />}>
                                                                {subItem.icon && <subItem.icon className="size-4" />}
                                                                <span>{t(subItem.name)}</span>
                                                            </SidebarMenuSubButton>
                                                        </SidebarMenuSubItem>
                                                    ))}
                                                </SidebarMenuSub>
                                            </CollapsibleContent>

                                        </SidebarMenuItem>
                                    </Collapsible>
                                )
                            }

                            return (
                                <SidebarMenuItem key={t(item.name)}>
                                    <SidebarMenuButton render={<NavLink to={item.link || "#"} />} tooltip={t(item.name)}>
                                        {item.icon && <item.icon />}
                                        <span className="group-data-[collapsible=icon]:hidden">{t(item.name)}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )

                        })}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </SidebarContent>
    )
}