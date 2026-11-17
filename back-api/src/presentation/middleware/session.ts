import type { MiddlewareHandler, Context } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import type { AppEnv, SessionData } from '#types.js'

const SESSION_COOKIE = 'hal_cinema_session'
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 // 7 days

export const sessionMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const sid = getCookie(c, SESSION_COOKIE)
  c.set('session', sid ? await c.get('container').sessionManager.find(sid) : null)
  await next()
}

export async function createSession(c: Context<AppEnv>, data: SessionData): Promise<void> {
  const sid = await c.get('container').sessionManager.create(data)
  setCookie(c, SESSION_COOKIE, sid, {
    httpOnly: true,
    sameSite: 'Lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
    secure: c.env.ENVIRONMENT === 'production',
  })
}

export async function destroySession(c: Context<AppEnv>): Promise<void> {
  const sid = getCookie(c, SESSION_COOKIE)
  if (sid) await c.get('container').sessionManager.destroy(sid)
  deleteCookie(c, SESSION_COOKIE, { path: '/' })
}
