import { type BreadcrumbDropdownItem } from "@/components/blocks/breadcrumb"
import { KeyRoundIcon, LockIcon, PaletteIcon, SettingsIcon } from "lucide-react"

export const TenantsBreadcrumbData: BreadcrumbDropdownItem[] = [
    {
        label: "layout.api_keys",
        to: "/tenant/api-keys",
        icon: KeyRoundIcon
    }
]
