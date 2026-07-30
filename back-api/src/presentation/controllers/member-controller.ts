import type { Context } from 'hono'
import { createMemberRequestSchema } from '#application/dto/members.js'
import type { MemberService } from '#application/services/member-service.js'
import { DomainError } from '#domain/errors/domain-error.js'
import { AppError } from '#lib/errors.js'
import type { AppEnv } from '#types.js'
import { successResponse } from '#presentation/response.js'

export class MemberController {
  constructor(private readonly service: MemberService) {}
  create = async (c: Context<AppEnv>) => {
    const body = await c.req.json().catch(() => { throw new AppError('VALIDATION_ERROR', 'Invalid JSON body') })
    const result = await this.service.create(createMemberRequestSchema.parse(body))
    return c.json(successResponse(result.member, c.get('requestId')), result.created ? 201 : 200)
  }
  getProfile = async (c: Context<AppEnv>) => {
    const memberId = this.requireMemberId(c)
    try { return c.json(successResponse(await this.service.getProfile(memberId), c.get('requestId'))) }
    catch (error) { throw this.toAppError(error) }
  }
  getReservations = async (c: Context<AppEnv>) => {
    const memberId = this.requireMemberId(c)
    return c.json(successResponse(await this.service.getReservations(memberId), c.get('requestId')))
  }
  private requireMemberId(c: Context<AppEnv>): number {
    const session = c.get('session'); if (!session) throw new AppError('UNAUTHORIZED', 'Not authenticated'); return session.memberId
  }
  private toAppError(error: unknown): Error { return error instanceof DomainError ? new AppError(error.code, error.message) : error as Error }
}
