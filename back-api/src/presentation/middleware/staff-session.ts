import type { MiddlewareHandler } from 'hono'
import { deleteCookie, getCookie } from 'hono/cookie'
import { and, eq, gt, isNull } from 'drizzle-orm'
import type { AppEnv } from '#types.js'
import { db } from '#infrastructure/database/mysqlPool.js'
import { staffAccounts, staffSessions } from '#infrastructure/database/schema.js'
import { hashToken, STAFF_SESSION_COOKIE } from '#lib/staff-auth.js'

export const staffSessionMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const token = getCookie(c, STAFF_SESSION_COOKIE)
  if (!token) { c.set('staffSession', null); return next() }
  const [row] = await db.select({ id: staffAccounts.id, roleId: staffAccounts.roleId, userId: staffAccounts.userId })
    .from(staffSessions).innerJoin(staffAccounts, eq(staffSessions.staffAccountId, staffAccounts.id))
    .where(and(eq(staffSessions.tokenHash, hashToken(token)), isNull(staffSessions.revokedAt), gt(staffSessions.expiresAt, new Date()), eq(staffAccounts.status, 'active')))
  if (!row) { deleteCookie(c, STAFF_SESSION_COOKIE, { path: '/' }); c.set('staffSession', null) }
  else c.set('staffSession', { staffId: row.id, roleId: row.roleId, userId: row.userId })
  await next()
}
