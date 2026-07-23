import type { Context } from 'hono'
import type { AuthService } from '#application/services/auth-service.js'
import { sendOtpRequestSchema, verifyOtpRequestSchema } from '#application/dto/auth.js'
import { DomainError } from '#domain/errors/domain-error.js'
import { AppError } from '#lib/errors.js'
import type { AppEnv } from '#types.js'
import { createSession, destroySession } from '#presentation/middleware/session.js'
import { successResponse } from '#presentation/response.js'

export class AuthController {
  constructor(private readonly service: AuthService) {}
  getMe = (c: Context<AppEnv>) => {
    const session = c.get('session'); const requestId = c.get('requestId')
    return c.json(successResponse(session ? { authenticated: true, memberId: session.memberId } : { authenticated: false }, requestId), 200)
  }
  sendOtp = async (c: Context<AppEnv>) => {
    const body = await c.req.json().catch(() => { throw new AppError('VALIDATION_ERROR', 'Invalid JSON body') })
    const input = sendOtpRequestSchema.parse(body); const requestId = c.get('requestId')
    try { return c.json(successResponse(await this.service.sendOtp(input, this.clientIp(c)), requestId), 200) }
    catch (error) { throw this.toAppError(error) }
  }
  verifyOtp = async (c: Context<AppEnv>) => {
    const body = await c.req.json().catch(() => { throw new AppError('VALIDATION_ERROR', 'Invalid JSON body') })
    const input = verifyOtpRequestSchema.parse(body); const requestId = c.get('requestId')
    try { const result = await this.service.verifyOtp(input, this.clientIp(c)); createSession(c, { memberId: result.memberId }); return c.json(successResponse(result, requestId), 200) }
    catch (error) { throw this.toAppError(error) }
  }
  logout = (c: Context<AppEnv>) => {
    const session = c.get('session'); if (!session) throw new AppError('UNAUTHORIZED', 'Not authenticated')
    destroySession(c); return c.json(successResponse({ loggedOut: true }, c.get('requestId')), 200)
  }
  private clientIp(c: Context<AppEnv>): string { return c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown' }
  private toAppError(error: unknown): Error { return error instanceof DomainError ? new AppError(error.code, error.message) : error as Error }
}
