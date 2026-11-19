import type { Context } from 'hono'
import { deleteCookie, setCookie } from 'hono/cookie'
import type { AppEnv } from '#types.js'

/**
 * Staff cookie names and the only place that writes them. The tokens stay
 * opaque here; their meaning is resolved by StaffAuthService.
 */
export const STAFF_SESSION_COOKIE = 'hal_staff_session'
export const STAFF_CHALLENGE_COOKIE = 'hal_staff_challenge'

/** Production flag comes from the binding so local and deployed runs share one rule. */
const isProduction = (c: Context<AppEnv>) => c.env.ENVIRONMENT === 'production'

const cookieOptions = (c: Context<AppEnv>, maxAge: number) => ({
  httpOnly: true,
  sameSite: 'Lax' as const,
  path: '/',
  maxAge,
  secure: isProduction(c),
})

export function setStaffSessionCookie(c: Context<AppEnv>, token: string, maxAge: number): void {
  setCookie(c, STAFF_SESSION_COOKIE, token, cookieOptions(c, maxAge))
}

export function setStaffChallengeCookie(c: Context<AppEnv>, token: string, maxAge: number): void {
  setCookie(c, STAFF_CHALLENGE_COOKIE, token, cookieOptions(c, maxAge))
}

export function clearStaffSessionCookie(c: Context<AppEnv>): void {
  deleteCookie(c, STAFF_SESSION_COOKIE, { path: '/' })
}

export function clearStaffChallengeCookie(c: Context<AppEnv>): void {
  deleteCookie(c, STAFF_CHALLENGE_COOKIE, { path: '/' })
}
