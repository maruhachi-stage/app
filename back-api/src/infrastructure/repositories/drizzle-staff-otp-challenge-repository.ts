import { and, eq, gt, isNull } from 'drizzle-orm'
import { db } from '#infrastructure/database/sqlite.js'
import { staffOtpChallenges } from '#infrastructure/database/schema.js'
import type { StaffOtpChallenge } from '#domain/entities/staff-account.js'
import type { StaffOtpChallengeRepository } from '#domain/interfaces/repositories/staff-otp-challenge-repository.js'

export class DrizzleStaffOtpChallengeRepository implements StaffOtpChallengeRepository {
  async create(input: {
    challengeTokenHash: string
    staffAccountId: number
    otpHash: string
    expiresAt: Date
  }): Promise<void> {
    await db.insert(staffOtpChallenges).values(input)
  }

  async findActiveByTokenHash(
    challengeTokenHash: string,
    now: Date,
  ): Promise<StaffOtpChallenge | null> {
    const [row] = await db
      .select()
      .from(staffOtpChallenges)
      .where(
        and(
          eq(staffOtpChallenges.challengeTokenHash, challengeTokenHash),
          isNull(staffOtpChallenges.usedAt),
          gt(staffOtpChallenges.expiresAt, now),
        ),
      )
      .limit(1)
    if (!row) return null
    return {
      id: row.id,
      staffAccountId: row.staffAccountId,
      otpHash: row.otpHash,
      expiresAt: row.expiresAt,
      usedAt: row.usedAt,
      failedAttempts: row.failedAttempts,
    }
  }

  async recordFailure(id: number, failedAttempts: number): Promise<void> {
    await db.update(staffOtpChallenges).set({ failedAttempts }).where(eq(staffOtpChallenges.id, id))
  }

  async markUsed(id: number, usedAt: Date): Promise<void> {
    await db.update(staffOtpChallenges).set({ usedAt }).where(eq(staffOtpChallenges.id, id))
  }

  async invalidateActive(staffAccountId: number, usedAt: Date): Promise<void> {
    await db
      .update(staffOtpChallenges)
      .set({ usedAt })
      .where(
        and(
          eq(staffOtpChallenges.staffAccountId, staffAccountId),
          isNull(staffOtpChallenges.usedAt),
        ),
      )
  }
}
