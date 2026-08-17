import { PageBreadcrumb } from "./breadcrumb";
import { HandMetalIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export const DashboardHeader = () => {

    const { t } = useTranslation();

    const user = { name: "Lyle Kauffman" };

    return (
        <div className="space-y-4">
            
            <PageBreadcrumb />
            
            <div className="flex items-center gap-2">
                <div className="bg-primary-foreground p-2 rounded-2xl">
                    <HandMetalIcon className="md:size-5 size-4 -rotate-12 text-primary" />
                </div>
                <h1 className="md:text-2xl text-xl font-semibold">
                    {t("pages.platform.dashboard.welcome", { name: user.name })}!
                </h1>
            </div>

        </div>
    )
}
