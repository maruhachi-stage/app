import { createContext, useCallback, useContext, useState } from "react"
import type { ReactNode } from "react"
import {
  getCurrentStaff,
  logout as logoutRequest,
  type AuthenticatedStaff,
} from "~/features/auth"

type StaffAuthContextValue = {
  staff: AuthenticatedStaff | null
  loading: boolean
  refresh: () => Promise<AuthenticatedStaff | null>
  setAuthenticatedStaff: (staff: AuthenticatedStaff) => void
  logout: () => Promise<void>
}

const StaffAuthContext = createContext<StaffAuthContextValue | null>(null)

export function StaffAuthProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<AuthenticatedStaff | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const current = await getCurrentStaff()
      setStaff(current)
      return current
    } catch {
      setStaff(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try { await logoutRequest() } finally { setStaff(null) }
  }, [])

  return <StaffAuthContext.Provider value={{ staff, loading, refresh, setAuthenticatedStaff: setStaff, logout }}>{children}</StaffAuthContext.Provider>
}

export function useStaffAuthContext() {
  const context = useContext(StaffAuthContext)
  if (!context) throw new Error("useStaffAuth must be used within StaffAuthProvider")
  return context
}
