import type { OtpPurpose } from '#application/dto/auth.js'
import type { OtpToken } from '#domain/entities/otp-token.js'

export interface OtpTokenRepository {
  findRecent(memberId: number, purpose: OtpPurpose, sinceSeconds: number): Promise<OtpToken | null>
  create(memberId: number, tokenHash: string, purpose: OtpPurpose, expiresAt: Date): Promise<void>
  findLatest(memberId: number, purpose: OtpPurpose): Promise<OtpToken | null>
  recordFailure(id: number, failedAttempts: number, lockedUntil?: Date): Promise<void>
  markUsed(id: number): Promise<void>
}
