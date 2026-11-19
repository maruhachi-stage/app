import { and, eq, gt, isNull } from 'drizzle-orm'
import type { Database } from '#infrastructure/database/database.js'
import { staffOtpChallenges } from '#infrastructure/database/schema.js'
import type { StaffOtpChallenge } from '#domain/entities/staff-account.js'
import type { StaffOtpChallengeRepository } from '#domain/interfaces/repositories/staff-otp-challenge-repository.js'

export class DrizzleStaffOtpChallengeRepository implements StaffOtpChallengeRepository {
  constructor(private readonly db: Database) {}

  async create(input: {
    challengeTokenHash: string
    staffAccountId: number
    otpHash: string
    expiresAt: Date
  }): Promise<void> {
    await this.db.insert(staffOtpChallenges).values(input)
  }

  async findActiveByTokenHash(
    challengeTokenHash: string,
    now: Date,
  ): Promise<StaffOtpChallenge | null> {
    const [row] = await this.db
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
    await this.db
      .update(staffOtpChallenges)
      .set({ failedAttempts })
      .where(eq(staffOtpChallenges.id, id))
  }

  async markUsed(id: number, usedAt: Date): Promise<void> {
    await this.db.update(staffOtpChallenges).set({ usedAt }).where(eq(staffOtpChallenges.id, id))
  }

  async invalidateActive(staffAccountId: number, usedAt: Date): Promise<void> {
    await this.db
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
