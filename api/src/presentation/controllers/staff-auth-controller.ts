import type { Context } from 'hono'
import type { AppEnv } from '#types.js'
import type { StaffAuthService } from '#application/services/staff-auth-service.js'
import {
  staffChangePasswordRequestSchema,
  staffCreateAccountRequestSchema,
  staffLoginRequestSchema,
  staffUpdateAccountRequestSchema,
  staffVerifyOtpRequestSchema,
} from '#application/dto/staff-auth.js'
import { AppError } from '#domain/errors/appError.js'
import { successResponse } from '#presentation/response.js'
import {
  clearStaffChallengeCookie,
  clearStaffSessionCookie,
  setStaffChallengeCookie,
  setStaffSessionCookie,
} from '#presentation/staff-session-cookie.js'
import { z } from 'zod'

export class StaffAuthController {
  constructor(private readonly service: StaffAuthService) {}

  login = async (c: Context<AppEnv>) => {
    const input = staffLoginRequestSchema.parse(await this.body(c))
    const result = await this.service.login(input, this.meta(c))
    setStaffChallengeCookie(c, result.challengeToken, result.expiresInSec)
    return c.json(
      successResponse(
        { otpRequired: result.otpRequired, expiresInSec: result.expiresInSec },
        c.get('requestId'),
      ),
      200,
    )
  }

  verifyOtp = async (c: Context<AppEnv>) => {
    const input = staffVerifyOtpRequestSchema.parse(await this.body(c))
    const result = await this.service.verifyOtp(c.get('staffChallengeToken'), input, this.meta(c))
    clearStaffChallengeCookie(c)
    setStaffSessionCookie(c, result.sessionToken, result.sessionMaxAgeSec)
    return c.json(
      successResponse(
        { authenticated: result.authenticated, staff: result.staff },
        c.get('requestId'),
      ),
      200,
    )
  }

  resendOtp = async (c: Context<AppEnv>) => {
    const result = await this.service.resendOtp(c.get('staffChallengeToken'), this.meta(c))
    setStaffChallengeCookie(c, result.challengeToken, result.expiresInSec)
    return c.json(
      successResponse({ resent: true, expiresInSec: result.expiresInSec }, c.get('requestId')),
      200,
    )
  }

  me = async (c: Context<AppEnv>) => {
    const result = await this.service.getMe(this.sessionToken(c))
    return c.json(successResponse(result, c.get('requestId')), 200)
  }

  logout = async (c: Context<AppEnv>) => {
    await this.service.logout(this.sessionToken(c), this.meta(c))
    clearStaffSessionCookie(c)
    clearStaffChallengeCookie(c)
    return c.json(successResponse({ loggedOut: true }, c.get('requestId')), 200)
  }

  changePassword = async (c: Context<AppEnv>) => {
    const input = staffChangePasswordRequestSchema.parse(await this.body(c))
    await this.service.changePassword(this.requireSession(c), input, this.meta(c))
    return c.json(successResponse({ changed: true }, c.get('requestId')), 200)
  }

  listAccounts = async (c: Context<AppEnv>) =>
    c.json(
      successResponse({ accounts: await this.service.listAccounts() }, c.get('requestId')),
      200,
    )

  createAccount = async (c: Context<AppEnv>) => {
    const input = staffCreateAccountRequestSchema.parse(await this.body(c))
    const created = await this.service.createAccount(input, this.meta(c))
    return c.json(successResponse(created, c.get('requestId')), 201)
  }

  updateAccount = async (c: Context<AppEnv>) => {
    const staffId = z.coerce.number().int().positive().parse(c.req.param('staffId'))
    const input = staffUpdateAccountRequestSchema.parse(await this.body(c))
    await this.service.updateAccount(staffId, input, this.meta(c))
    return c.json(successResponse({ updated: true }, c.get('requestId')), 200)
  }

  resetOtp = async (c: Context<AppEnv>) => {
    const staffId = z.coerce.number().int().positive().parse(c.req.param('staffId'))
    await this.service.resetOtp(staffId, this.meta(c))
    return c.json(successResponse({ reset: true }, c.get('requestId')), 200)
  }

  private requireSession(c: Context<AppEnv>): number {
    const session = c.get('staffSession')
    if (!session) throw new AppError('UNAUTHORIZED', 'Staff authentication required')
    return session.staffId
  }

  private sessionToken(c: Context<AppEnv>): string | null {
    // The session middleware already resolved this cookie, so it is safe to reuse.
    return c.get('staffSession')?.sessionToken ?? null
  }

  private meta(c: Context<AppEnv>) {
    return {
      requestId: c.get('requestId'),
      ipAddress: c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? null,
      userAgent: c.req.header('user-agent') ?? null,
      actorStaffId: c.get('staffSession')?.staffId ?? null,
    }
  }

  private async body(c: Context<AppEnv>): Promise<unknown> {
    return c.req.json().catch(() => {
      throw new AppError('VALIDATION_ERROR', 'Invalid JSON body')
    })
  }
}
