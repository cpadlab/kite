import { type BreadcrumbDropdownItem } from "@/components/blocks/breadcrumb"
import { KeyRoundIcon, UsersIcon } from "lucide-react"

export const TenantsBreadcrumbData: BreadcrumbDropdownItem[] = [
    {
        label: "layout.api_keys",
        to: "/tenant/api-keys",
        icon: KeyRoundIcon
    },
    {
        label: "layout.users",
        to: "/tenant/users",
        icon: UsersIcon
    }
]
