import type { StaffOtpChallenge } from '#domain/entities/staff-account.js'

export interface StaffOtpChallengeRepository {
  create(input: {
    challengeTokenHash: string
    staffAccountId: number
    otpHash: string
    expiresAt: Date
  }): Promise<void>
  findActiveByTokenHash(challengeTokenHash: string, now: Date): Promise<StaffOtpChallenge | null>
  recordFailure(id: number, failedAttempts: number): Promise<void>
  markUsed(id: number, usedAt: Date): Promise<void>
  invalidateActive(staffAccountId: number, usedAt: Date): Promise<void>
}
