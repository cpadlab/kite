import Logo from "@/assets/logo"
import { Sidebar, SidebarHeader } from "@/components/ui/sidebar"
import { Footer } from "./components/footer"
import { Body } from "./components/body"

export const LeftBar = () => {
    return (
        <Sidebar collapsible="icon" className="border-r-border border-r z-10">

            <SidebarHeader className="flex items-center justify-center border-b p-4">
                <div className="flex items-center gap-2 w-full">
                    <div className="p-2 bg-primary rounded-md shadow-inner shadow-primary-foreground/50">
                        <Logo className="fill-primary-foreground size-4" />
                    </div>
                    <p className="text-primary dark:text-primary-foreground text-2xl font-semibold">Kite</p>
                </div>
            </SidebarHeader>

            <Body />
            <Footer />

        </Sidebar>
    )
}