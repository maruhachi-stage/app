import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { and, desc, eq, gt, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { AppEnv } from '#types.js'
import { AppError } from '#lib/errors.js'
import { getStaffRole } from '#config/staff-roles.js'
import { db } from '#infrastructure/database/mysqlPool.js'
import { staffAccounts, staffAuditLogs, staffOtpChallenges, staffSessions } from '#infrastructure/database/schema.js'
import { createOtp, createToken, hashPassword, hashToken, STAFF_CHALLENGE_COOKIE, STAFF_OTP_EXPIRES_MIN, STAFF_SESSION_COOKIE, STAFF_SESSION_MAX_AGE, verifyPassword } from '#lib/staff-auth.js'
import { sendOtpEmail } from '#lib/email.js'
import { successResponse } from '#presentation/response.js'
import type { AdminOverviewService } from '#application/services/admin-overview-service.js'

const loginSchema = z.object({ userId: z.string().min(3).max(80), password: z.string().min(8).max(200) })
const otpSchema = z.object({ code: z.string().regex(/^\d{6}$/) })
const passwordSchema = z.object({ currentPassword: z.string().min(8).max(200), newPassword: z.string().min(12).max(200) })
const accountSchema = z.object({ userId: z.string().min(3).max(80), displayName: z.string().min(1).max(100), email: z.string().email().max(254), password: z.string().min(12).max(200), roleId: z.number().int() })
const accountPatchSchema = accountSchema.partial().omit({ password: true })

export class StaffAuthController {
  constructor(private readonly overviewService: AdminOverviewService) {}

  login = async (c: Context<AppEnv>) => {
    const input = loginSchema.parse(await this.body(c)); const now = new Date()
    const [account] = await db.select().from(staffAccounts).where(eq(staffAccounts.userId, input.userId))
    if (!account || account.status !== 'active' || (account.lockedUntil && account.lockedUntil > now) || !(await verifyPassword(account.passwordHash, input.password))) {
      if (account) await db.update(staffAccounts).set({ failedLoginCount: sql`${staffAccounts.failedLoginCount} + 1`, lockedUntil: account.failedLoginCount + 1 >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null }).where(eq(staffAccounts.id, account.id))
      throw new AppError('UNAUTHORIZED', 'Invalid user ID or password')
    }
    await db.update(staffAccounts).set({ failedLoginCount: 0, lockedUntil: null }).where(eq(staffAccounts.id, account.id))
    await this.issueOtp(c, account.id, account.email)
    return c.json(successResponse({ otpRequired: true, expiresInSec: STAFF_OTP_EXPIRES_MIN * 60 }, c.get('requestId')))
  }

  resendOtp = async (c: Context<AppEnv>) => {
    const challenge = await this.challenge(c)
    await this.issueOtp(c, challenge.staffAccountId, challenge.email)
    return c.json(successResponse({ resent: true, expiresInSec: STAFF_OTP_EXPIRES_MIN * 60 }, c.get('requestId')))
  }

  verifyOtp = async (c: Context<AppEnv>) => {
    const input = otpSchema.parse(await this.body(c)); const challenge = await this.challenge(c)
    if (challenge.failedAttempts >= 5) throw new AppError('FORBIDDEN', 'Too many OTP attempts')
    if (challenge.otpHash !== hashToken(input.code)) { await db.update(staffOtpChallenges).set({ failedAttempts: sql`${staffOtpChallenges.failedAttempts} + 1` }).where(eq(staffOtpChallenges.id, challenge.id)); throw new AppError('UNAUTHORIZED', 'Invalid OTP') }
    await db.update(staffOtpChallenges).set({ usedAt: new Date() }).where(eq(staffOtpChallenges.id, challenge.id))
    const token = createToken()
    await db.insert(staffSessions).values({ tokenHash: hashToken(token), staffAccountId: challenge.staffAccountId, expiresAt: new Date(Date.now() + STAFF_SESSION_MAX_AGE * 1000), ipAddress: this.ip(c), userAgent: c.req.header('user-agent')?.slice(0, 500) })
    await db.update(staffAccounts).set({ lastLoginAt: new Date() }).where(eq(staffAccounts.id, challenge.staffAccountId))
    deleteCookie(c, STAFF_CHALLENGE_COOKIE, { path: '/' }); this.setSessionCookie(c, token)
    await this.audit(challenge.staffAccountId, 'staff.auth.login', c)
    return c.json(successResponse({ authenticated: true, staff: this.profile(challenge) }, c.get('requestId')))
  }

  me = async (c: Context<AppEnv>) => {
    const session = c.get('staffSession'); if (!session) return c.json(successResponse({ authenticated: false }, c.get('requestId')))
    const [account] = await db.select().from(staffAccounts).where(eq(staffAccounts.id, session.staffId)); if (!account) throw new AppError('UNAUTHORIZED', 'Staff session invalid')
    return c.json(successResponse({ authenticated: true, staff: this.profile(account) }, c.get('requestId')))
  }

  logout = async (c: Context<AppEnv>) => { const session = c.get('staffSession'); if (session) { const token = getCookie(c, STAFF_SESSION_COOKIE); if (token) await db.update(staffSessions).set({ revokedAt: new Date() }).where(eq(staffSessions.tokenHash, hashToken(token))); await this.audit(session.staffId, 'staff.auth.logout', c) }; deleteCookie(c, STAFF_SESSION_COOKIE, { path: '/' }); return c.json(successResponse({ loggedOut: true }, c.get('requestId'))) }
  changePassword = async (c: Context<AppEnv>) => { const session = this.requireSession(c); const input = passwordSchema.parse(await this.body(c)); const [account] = await db.select().from(staffAccounts).where(eq(staffAccounts.id, session.staffId)); if (!account || !(await verifyPassword(account.passwordHash, input.currentPassword))) throw new AppError('UNAUTHORIZED', 'Current password is invalid'); await db.update(staffAccounts).set({ passwordHash: await hashPassword(input.newPassword) }).where(eq(staffAccounts.id, session.staffId)); await this.audit(session.staffId, 'staff.auth.password_changed', c); return c.json(successResponse({ changed: true }, c.get('requestId'))) }
  overview = async (c: Context<AppEnv>) => c.json(successResponse({ screens: (await this.overviewService.getOverview()).screens }, c.get('requestId')))

  listAccounts = async (c: Context<AppEnv>) => { const rows = await db.select().from(staffAccounts).orderBy(desc(staffAccounts.createdAt)); return c.json(successResponse({ accounts: rows.map((a) => this.profile(a, true)) }, c.get('requestId'))) }
  createAccount = async (c: Context<AppEnv>) => { const input = accountSchema.parse(await this.body(c)); if (!getStaffRole(input.roleId)) throw new AppError('VALIDATION_ERROR', 'Unknown role ID'); const [created] = await db.insert(staffAccounts).values({ ...input, passwordHash: await hashPassword(input.password) }).$returningId(); await this.audit(this.requireSession(c).staffId, 'staff.account.created', c, 'staff_account', String(created.id)); return c.json(successResponse({ id: created.id }, c.get('requestId')), 201) }
  updateAccount = async (c: Context<AppEnv>) => { const id = z.coerce.number().int().positive().parse(c.req.param('staffId')); const input = accountPatchSchema.parse(await this.body(c)); if (input.roleId !== undefined && !getStaffRole(input.roleId)) throw new AppError('VALIDATION_ERROR', 'Unknown role ID'); await db.update(staffAccounts).set(input).where(eq(staffAccounts.id, id)); await this.audit(this.requireSession(c).staffId, 'staff.account.updated', c, 'staff_account', String(id)); return c.json(successResponse({ updated: true }, c.get('requestId'))) }
  resetOtp = async (c: Context<AppEnv>) => { const id = z.coerce.number().int().positive().parse(c.req.param('staffId')); await db.update(staffOtpChallenges).set({ usedAt: new Date() }).where(and(eq(staffOtpChallenges.staffAccountId, id), isNull(staffOtpChallenges.usedAt))); await this.audit(this.requireSession(c).staffId, 'staff.account.otp_reset', c, 'staff_account', String(id)); return c.json(successResponse({ reset: true }, c.get('requestId'))) }

  private async issueOtp(c: Context<AppEnv>, staffAccountId: number, email: string) { const token = createToken(); const code = createOtp(); await db.insert(staffOtpChallenges).values({ challengeTokenHash: hashToken(token), staffAccountId, otpHash: hashToken(code), expiresAt: new Date(Date.now() + STAFF_OTP_EXPIRES_MIN * 60 * 1000) }); setCookie(c, STAFF_CHALLENGE_COOKIE, token, { httpOnly: true, sameSite: 'Lax', secure: process.env.NODE_ENV === 'production', maxAge: STAFF_OTP_EXPIRES_MIN * 60, path: '/' }); await sendOtpEmail(email, code, 'スタッフログイン') }
  private async challenge(c: Context<AppEnv>) { const token = getCookie(c, STAFF_CHALLENGE_COOKIE); if (!token) throw new AppError('UNAUTHORIZED', 'OTP challenge not found'); const [row] = await db.select({ id: staffOtpChallenges.id, staffAccountId: staffOtpChallenges.staffAccountId, otpHash: staffOtpChallenges.otpHash, failedAttempts: staffOtpChallenges.failedAttempts, email: staffAccounts.email, userId: staffAccounts.userId, displayName: staffAccounts.displayName, roleId: staffAccounts.roleId }).from(staffOtpChallenges).innerJoin(staffAccounts, eq(staffOtpChallenges.staffAccountId, staffAccounts.id)).where(and(eq(staffOtpChallenges.challengeTokenHash, hashToken(token)), isNull(staffOtpChallenges.usedAt), gt(staffOtpChallenges.expiresAt, new Date()), eq(staffAccounts.status, 'active'))); if (!row) throw new AppError('UNAUTHORIZED', 'OTP challenge expired'); return row }
  private profile(account: { id?: number; staffAccountId?: number; userId: string; displayName: string; roleId: number }, includeStatus = false) { const role = getStaffRole(account.roleId); return { id: account.staffAccountId ?? account.id, userId: account.userId, displayName: account.displayName, roleId: account.roleId, roleName: role?.name, permissions: role?.permissions ?? [], ...(includeStatus ? {} : {}) } }
  private requireSession(c: Context<AppEnv>) { const session = c.get('staffSession'); if (!session) throw new AppError('UNAUTHORIZED', 'Staff authentication required'); return session }
  private async audit(staffAccountId: number, action: string, c: Context<AppEnv>, targetType?: string, targetId?: string) { await db.insert(staffAuditLogs).values({ staffAccountId, action, targetType, targetId, requestId: c.get('requestId'), ipAddress: this.ip(c) }) }
  private setSessionCookie(c: Context<AppEnv>, token: string) { setCookie(c, STAFF_SESSION_COOKIE, token, { httpOnly: true, sameSite: 'Lax', secure: process.env.NODE_ENV === 'production', maxAge: STAFF_SESSION_MAX_AGE, path: '/' }) }
  private async body(c: Context<AppEnv>) { return c.req.json().catch(() => { throw new AppError('VALIDATION_ERROR', 'Invalid JSON body') }) }
  private ip(c: Context<AppEnv>) { return c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown' }
}
