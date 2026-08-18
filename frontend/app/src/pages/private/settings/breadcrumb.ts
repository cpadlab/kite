import { type BreadcrumbDropdownItem } from "@/components/blocks/breadcrumb"
import { KeyRoundIcon, LockIcon, PaletteIcon, SettingsIcon } from "lucide-react"

export const SettingsBreadcrumbData: BreadcrumbDropdownItem[] = [
    {
        label: "layout.preferences",
        to: "/settings/preferences",
        icon: SettingsIcon
    },
    {
        label: "layout.appearance",
        to: "/settings/appearance",
        icon: PaletteIcon
    },
    {
        label: "layout.security",
        to: "/settings/security",
        icon: LockIcon
    },
    {
        label: "layout.api_keys",
        to: "/settings/api-keys",
        icon: KeyRoundIcon
    }
]
