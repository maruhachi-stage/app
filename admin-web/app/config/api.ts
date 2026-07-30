export const apiPrefixes = {
  legacy: "/api",
  v1: "/api/v1",
} as const

type ApiVersion = keyof typeof apiPrefixes

function resolveApiVersion(value: unknown): ApiVersion {
  return value === "legacy" || value === "v1" ? value : "v1"
}

export const apiVersion = resolveApiVersion(import.meta.env.VITE_API_VERSION)
export const apiPrefix = apiPrefixes[apiVersion]

export const staffApiPaths = {
  auth: {
    login: "staff/auth/login",
    verifyOtp: "staff/auth/otp/verify",
    resendOtp: "staff/auth/otp/resend",
    me: "staff/auth/me",
    logout: "staff/auth/logout",
    password: "staff/auth/password",
  },
  overview: "staff/overview",
  accounts: "staff/accounts",
} as const

export function apiPath(path: string): string {
  return `${apiPrefix}/${path.replace(/^\/+/, "")}`
}
