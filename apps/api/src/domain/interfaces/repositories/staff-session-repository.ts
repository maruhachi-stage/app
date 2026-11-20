import type { StaffSessionContext } from '#domain/entities/staff-account.js'

export interface StaffSessionRepository {
  create(input: {
    tokenHash: string
    staffAccountId: number
    expiresAt: Date
    ipAddress: string | null
    userAgent: string | null
  }): Promise<void>
  findActiveByTokenHash(tokenHash: string, now: Date): Promise<StaffSessionContext | null>
  revokeByTokenHash(tokenHash: string, revokedAt: Date): Promise<void>
}
