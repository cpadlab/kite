import React, { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
    theme: Theme
    setTheme: (theme: Theme) => void
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'theme'

export const ThemeProvider: React.FC<{ children: React.ReactNode; defaultTheme?: Theme }> = ({
    children,
    defaultTheme = 'system',
}) => {

    const [theme, setThemeState] = useState<Theme>(() => {
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
        return storedTheme || defaultTheme
    })

    useEffect(() => {
        const root = document.documentElement
        
        const applyTheme = () => {
            root.classList.remove('light', 'dark')
            let activeTheme = theme
            if (theme === 'system') {
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                activeTheme = systemPrefersDark ? 'dark' : 'light'
            }
            root.classList.add(activeTheme)
        }

        applyTheme()
        localStorage.setItem(THEME_STORAGE_KEY, theme)

        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
            const listener = () => applyTheme()
            mediaQuery.addEventListener('change', listener)
            return () => {
                mediaQuery.removeEventListener('change', listener)
            }
        }
    }, [theme])

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme)
    }

    const toggleTheme = () => {
        setThemeState((prev) => {
            if (prev === 'system') {
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                return systemPrefersDark ? 'light' : 'dark'
            }
            return prev === 'light' ? 'dark' : 'light'
        })
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}
