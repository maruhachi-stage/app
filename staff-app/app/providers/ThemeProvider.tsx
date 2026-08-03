import { createContext, useCallback, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"

export type ThemeMode = "light" | "dark" | "system"

type ThemeContextValue = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

const STORAGE_KEY = "staff-theme-mode"
const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system")
  const apply = useCallback((nextMode: ThemeMode) => {
    const dark = nextMode === "dark" || (nextMode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
    document.documentElement.dataset.theme = dark ? "dark" : "light"
  }, [])

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    const nextMode: ThemeMode = saved === "light" || saved === "dark" || saved === "system" ? saved : "system"
    setModeState(nextMode)
    apply(nextMode)
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => { if (nextMode === "system") apply("system") }
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [apply])

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode)
    window.localStorage.setItem(STORAGE_KEY, nextMode)
    apply(nextMode)
  }, [apply])

  return <ThemeContext.Provider value={{ mode, setMode }}>{children}</ThemeContext.Provider>
}

export function useThemeContext() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error("useThemeMode must be used within ThemeProvider")
  return context
}
