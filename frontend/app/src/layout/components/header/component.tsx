import { SidebarTrigger } from "@/components/ui/sidebar"
import { HeaderAvatar } from "./components/avatar/component"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { BellRingIcon, CodeXmlIcon, GiftIcon, PanelLeftIcon } from "lucide-react"
import { Search } from "./components/search"

export const Header = () => {
    return (
        <header className="h-[67px] flex bg-sidebar justify-between items-center gap-4 px-4 border-b">
            
            <div className="flex items-center gap-2">
                <SidebarTrigger render={
                    <Button size="icon" variant="ghost" className="text-muted-foreground">
                        <PanelLeftIcon />
                    </Button>
                } />
                <Search />
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="text-muted-foreground md:flex hidden">
                        <CodeXmlIcon  />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-muted-foreground md:flex hidden">
                        <GiftIcon />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-muted-foreground md:flex hidden">
                        <BellRingIcon />
                    </Button>
                </div>
                <Separator orientation="vertical" />
                <HeaderAvatar />
            </div>

        </header>
    )
}
