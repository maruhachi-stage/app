import type { MiddlewareHandler, Context } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { randomUUID } from 'crypto'
import type { AppEnv, SessionData } from '#types.js'

const SESSION_COOKIE = 'hal_cinema_session'
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 // 7 days

// In-memory session store (replace with Redis in production)
const sessionStore = new Map<string, { data: SessionData; expiresAt: number }>()

setInterval(() => {
  const now = Date.now()
  for (const [id, s] of sessionStore) {
    if (s.expiresAt < now) sessionStore.delete(id)
  }
}, 60 * 60 * 1000)

export const sessionMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const sid = getCookie(c, SESSION_COOKIE)
  if (sid) {
    const stored = sessionStore.get(sid)
    if (stored && stored.expiresAt > Date.now()) {
      c.set('session', stored.data)
    } else {
      if (sid) sessionStore.delete(sid)
      c.set('session', null)
    }
  } else {
    c.set('session', null)
  }
  await next()
}

export function createSession(c: Context<AppEnv>, data: SessionData): void {
  const sid = randomUUID()
  sessionStore.set(sid, { data, expiresAt: Date.now() + SESSION_MAX_AGE * 1000 })
  setCookie(c, SESSION_COOKIE, sid, {
    httpOnly: true,
    sameSite: 'Lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  })
}

export function destroySession(c: Context<AppEnv>): void {
  const sid = getCookie(c, SESSION_COOKIE)
  if (sid) sessionStore.delete(sid)
  deleteCookie(c, SESSION_COOKIE, { path: '/' })
}
