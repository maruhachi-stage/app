import type { MiddlewareHandler } from 'hono'
import { getCookie } from 'hono/cookie'
import type { AppEnv } from '#types.js'
import { STAFF_CHALLENGE_COOKIE, STAFF_SESSION_COOKIE } from '#presentation/staff-session-cookie.js'

/**
 * Resolves the staff session cookie to an active staff session. The cookie
 * value is only ever used as a lookup key, never trusted as an identity.
 */
export const staffSessionMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const sessionToken = getCookie(c, STAFF_SESSION_COOKIE) ?? null
  const session = await c.get('container').staffAuthService.resolveSession(sessionToken)
  c.set('staffSession', session)
  c.set('staffChallengeToken', getCookie(c, STAFF_CHALLENGE_COOKIE) ?? null)
  await next()
}
