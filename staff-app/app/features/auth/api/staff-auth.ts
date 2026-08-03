import { staffApiPaths } from "~/config/api"
import { apiRequest } from "~/lib/api-client"
import type { AuthenticatedStaff, LoginResult } from "~/features/auth/domain/staff"

type StaffResponse = {
  authenticated: boolean
  staff?: {
    id: number
    userId: string
    displayName: string
    roleId: number
    roleName?: string
    permissions: string[]
  }
}

export function login(userId: string, password: string) {
  return apiRequest<LoginResult>(staffApiPaths.auth.login, {
    method: "POST",
    body: JSON.stringify({ userId, password }),
  })
}

export function verifyOtp(code: string) {
  return apiRequest<StaffResponse>(staffApiPaths.auth.verifyOtp, {
    method: "POST",
    body: JSON.stringify({ code }),
  }).then(toAuthenticatedStaff)
}

export function resendOtp() {
  return apiRequest<LoginResult>(staffApiPaths.auth.resendOtp, { method: "POST" })
}

export function getCurrentStaff() {
  return apiRequest<StaffResponse>(staffApiPaths.auth.me).then(toAuthenticatedStaff)
}

export function logout() {
  return apiRequest<void>(staffApiPaths.auth.logout, { method: "POST" })
}

function toAuthenticatedStaff(response: StaffResponse): AuthenticatedStaff {
  if (!response.authenticated || !response.staff) throw new Error("スタッフ認証が必要です")
  return {
    id: response.staff.id,
    userId: response.staff.userId,
    displayName: response.staff.displayName,
    role: {
      id: response.staff.roleId,
      key: String(response.staff.roleId),
      name: response.staff.roleName ?? "スタッフ",
      permissions: response.staff.permissions,
    },
  }
}
