import { useTranslation } from "react-i18next"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"
import { SearchIcon } from "lucide-react"

export const Search = () => {

    const { t } = useTranslation()

    return (
        <InputGroup className="max-w-sm">
            
            <InputGroupInput placeholder={`${t("layout.search")}...`} />

            <InputGroupAddon>
                <SearchIcon className="text-muted-foreground" />
            </InputGroupAddon>

            <InputGroupAddon align="inline-end">
                <Kbd>⌘K</Kbd>
            </InputGroupAddon>

        </InputGroup>
    )
}
