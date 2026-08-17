import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb"
import { HouseIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

export const PageBreadcrumb = () => {

    const { t } = useTranslation()

    return (
        <Breadcrumb className="select-none">
            <BreadcrumbList>

                <BreadcrumbItem>
                    <BreadcrumbLink render={<Link to="/" />}>
                        <span className="flex items-center gap-1.5">
                            <HouseIcon className='size-3.5' />
                            <span>{t("layout.dashboard")}</span>
                        </span>
                    </BreadcrumbLink>
                </BreadcrumbItem>

            </BreadcrumbList>
        </Breadcrumb>
    )
}
