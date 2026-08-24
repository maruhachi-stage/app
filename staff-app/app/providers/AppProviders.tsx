import type { ReactNode } from "react"
import { StaffAuthProvider } from "~/providers/StaffAuthProvider"
import { ThemeProvider } from "~/providers/ThemeProvider"

export function AppProviders({ children }: { children: ReactNode }) {
  return <ThemeProvider><StaffAuthProvider>{children}</StaffAuthProvider></ThemeProvider>
}
