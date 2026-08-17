import Logo from "@/assets/logo"
import { Sidebar, SidebarHeader } from "@/components/ui/sidebar"
import { Footer } from "./components/footer"
import { Body } from "./components/body"

export const LeftBar = () => {
    return (
        <Sidebar collapsible="icon">

            <SidebarHeader className="flex items-center justify-center border-b p-4">
                <Logo className="fill-primary size-6" />
            </SidebarHeader>

            <Body />
            <Footer />

        </Sidebar>
    )
}