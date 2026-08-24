// Infrastructure: 認証API呼び出し
import { apiFetch } from "~/lib/api-client"

export type AuthState =
  | { authenticated: false }
  | { authenticated: true; memberId: number }

export async function getAuthState(): Promise<AuthState> {
  try {
    return await apiFetch<AuthState>("/auth/me")
  } catch {
    return { authenticated: false }
  }
}

export function safeRedirect(redirect: string | null | undefined): string {
  if (!redirect) return "/"
  if (redirect.startsWith("/") && !redirect.startsWith("//")) return redirect
  return "/"
}
