import { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

type ThemeContextValue = {
    theme: Theme
    setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
    const [theme, setTheme] = useState<Theme>('dark')

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as Theme | null
        if (savedTheme) {
            setTheme(savedTheme)
        }
    }, [])

    const updateTheme = (newTheme: Theme) => {
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)
    }

    return { theme, setTheme: updateTheme }
}

export function useThemeContext() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useThemeContext must be used within ThemeContext.Provider')
    }
    return context
}
