import { staffApiPaths } from "~/config/api"
import { apiRequest } from "~/lib/api-client"
import type { AuthenticatedStaff, LoginResult } from "~/features/auth/domain/staff"

export function login(userId: string, password: string) {
  return apiRequest<LoginResult>(staffApiPaths.auth.login, {
    method: "POST",
    body: JSON.stringify({ userId, password }),
  })
}

export function verifyOtp(code: string) {
  return apiRequest<AuthenticatedStaff>(staffApiPaths.auth.verifyOtp, {
    method: "POST",
    body: JSON.stringify({ code }),
  })
}

export function resendOtp() {
  return apiRequest<LoginResult>(staffApiPaths.auth.resendOtp, { method: "POST" })
}

export function getCurrentStaff() {
  return apiRequest<AuthenticatedStaff>(staffApiPaths.auth.me)
}

export function logout() {
  return apiRequest<void>(staffApiPaths.auth.logout, { method: "POST" })
}
