import { type BreadcrumbDropdownItem } from "@/components/blocks/breadcrumb"
import { Building2Icon, UsersIcon } from "lucide-react"

export const PlatformBreadcrumbData: BreadcrumbDropdownItem[] = [
    {
        label: "layout.tenants",
        to: "/platform/tenants",
        icon: Building2Icon
    },
    {
        label: "layout.users",
        to: "/platform/users",
        icon: UsersIcon
    }
]
