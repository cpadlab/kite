import React from 'react'
import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTheme, type Theme } from '@/context/theme'
import { GlobeIcon, SunIcon, MoonIcon, LaptopIcon, CheckIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"

interface Language {
    code: string
    label: string
}

interface ThemeOption {
    code: Theme
    labelKey: string
    icon: React.ComponentType<{ className?: string }>
}

export default function PublicLayout() {

    const { t, i18n } = useTranslation()
    const { theme, setTheme } = useTheme()

    const languages: Language[] = [
        { 
            code: 'es', 
            label: 'Español' 
        },
        { 
            code: 'en', 
            label: 'English' 
        },
    ]

    const themes: ThemeOption[] = [
        { 
            code: 'light', 
            labelKey: 'theme.light', 
            icon: SunIcon
        },
        { 
            code: 'dark', 
            labelKey: 'theme.dark', 
            icon: MoonIcon
        },
        { 
            code: 'system', 
            labelKey: 'theme.system', 
            icon: LaptopIcon
        },
    ]

    const currentLanguageLabel = languages.find((l) => l.code === i18n.language)?.label || 'Español'

    return (
        <div className="min-h-dvh relative flex items-center justify-center bg-background text-foreground transition-colors duration-200">
            
            <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
                
                <DropdownMenu>

                    <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
                        <GlobeIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium">{currentLanguageLabel}</span>
                    </DropdownMenuTrigger>
                    
                    <DropdownMenuContent align="end">
                        {languages.map((lang) => (
                            <DropdownMenuItem key={lang.code} onClick={() => i18n.changeLanguage(lang.code)} className="flex items-center justify-between cursor-pointer">
                                <span>{lang.label}</span>
                                {i18n.language === lang.code && (
                                    <CheckIcon className="h-3.5 w-3.5 text-primary ml-2" />
                                )}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>

                </DropdownMenu>

                <DropdownMenu>
                    
                    <DropdownMenuTrigger render={ <Button variant="outline" size="sm" />}>
                        {theme === 'dark' ? (
                            <MoonIcon className="h-4 w-4" />
                        ) : theme === 'system' ? (
                            <LaptopIcon className="h-4 w-4" />
                        ) : (
                            <SunIcon className="h-4 w-4" />
                        )}
                    </DropdownMenuTrigger>
                    
                    <DropdownMenuContent align="end">
                        {themes.map((item) => (
                            <DropdownMenuItem key={item.code} onClick={() => setTheme(item.code)} className="flex items-center justify-between cursor-pointer" >
                                <div className="flex items-center gap-2">
                                    <item.icon className="h-3.5 w-3.5" />
                                    <span>{t(item.labelKey)}</span>
                                </div>
                                {theme === item.code && (
                                    <CheckIcon className="h-3.5 w-3.5 text-primary ml-2" />
                                )}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>

                </DropdownMenu>
                
            </div>

            <div className="w-full">
                <Outlet />
            </div>

        </div>
    )
}
