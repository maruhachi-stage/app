// Presentation: 認証Context Provider
import { createContext, useContext, type ReactNode } from 'react'
import type { AuthState } from '~/lib/api/auth'

export type AuthContextValue = {
    auth: AuthState
    setAuth: (auth: AuthState) => void
}

export const AuthContext = createContext<AuthContextValue>({
    auth: { authenticated: false },
    setAuth: () => {},
})

export function useAuth() {
    return useContext(AuthContext)
}

type Props = {
    children: ReactNode
    value: AuthContextValue
}

export function AuthProvider({ children, value }: Props) {
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
