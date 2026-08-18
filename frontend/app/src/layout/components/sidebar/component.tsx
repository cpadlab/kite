import Logo from "@/assets/logo"
import { Sidebar, SidebarHeader } from "@/components/ui/sidebar"
import { Footer } from "./components/footer"
import { Body } from "./components/body"
import { useAuth } from "@/context/auth"

export const LeftBar = () => {
    const { user } = useAuth()

    return (
        <Sidebar collapsible="icon" className="border-r-border border-r z-10">

            <SidebarHeader className="flex items-center justify-center h-[67px] border-b p-4">
                <div className="flex items-center gap-2.5 w-full">
                    <div className="p-2 bg-primary rounded-md shadow-inner group-data-[collapsible=icon]:hidden shadow-primary-foreground/50 shrink-0">
                        <Logo className="fill-primary-foreground size-4" />
                    </div>
                    <Logo className="fill-primary size-4 min-w-4 max-w-4 min-h-4 max-h-4 group-data-[collapsible=icon]:block hidden" />
                    <div className="flex flex-col min-w-0 overflow-hidden group-data-[collapsible=icon]:hidden gap-0.5">
                        <p className="text-primary dark:text-primary-foreground text-xl font-bold leading-none">Kite</p>
                        {user?.tenantName && (
                            <span className="text-xs text-muted-foreground truncate font-medium leading-none">
                                {user.tenantName}
                            </span>
                        )}
                    </div>
                </div>
            </SidebarHeader>

            <Body />
            <Footer />

        </Sidebar>
    )
}