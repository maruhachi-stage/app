import { useThemeContext } from "~/providers/ThemeProvider"

export type { ThemeMode } from "~/providers/ThemeProvider"

export function useThemeMode() {
  return useThemeContext()
}
