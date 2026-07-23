import { and, desc, eq, gt, sql } from 'drizzle-orm'
import type { OtpPurpose } from '#application/dto/auth.js'
import { db } from '#infrastructure/database/mysqlPool.js'
import { otpTokens } from '#infrastructure/database/schema.js'
import type { OtpToken } from '#domain/entities/otp-token.js'
import type { OtpTokenRepository } from '#domain/interfaces/repositories/otp-token-repository.js'

export class DrizzleOtpTokenRepository implements OtpTokenRepository {
  async findRecent(memberId: number, purpose: OtpPurpose, sinceSeconds: number): Promise<OtpToken | null> {
    const [row] = await db.select().from(otpTokens)
      .where(and(eq(otpTokens.memberId, memberId), eq(otpTokens.purpose, purpose), gt(otpTokens.createdAt, sql`DATE_SUB(NOW(3), INTERVAL ${sinceSeconds} SECOND)`)))
      .limit(1)
    return row ? this.token(row) : null
  }
  async create(memberId: number, tokenHash: string, purpose: OtpPurpose, expiresAt: Date): Promise<void> {
    await db.insert(otpTokens).values({ memberId, tokenHash, purpose, expiresAt })
  }
  async findLatest(memberId: number, purpose: OtpPurpose): Promise<OtpToken | null> {
    const [row] = await db.select().from(otpTokens)
      .where(and(eq(otpTokens.memberId, memberId), eq(otpTokens.purpose, purpose)))
      .orderBy(desc(otpTokens.createdAt))
      .limit(1)
    return row ? this.token(row) : null
  }
  async recordFailure(id: number, failedAttempts: number, lockedUntil?: Date): Promise<void> {
    await db.update(otpTokens)
      .set(lockedUntil ? { failedAttempts, lockedUntil } : { failedAttempts })
      .where(eq(otpTokens.id, id))
  }
  async markUsed(id: number): Promise<void> {
    await db.update(otpTokens).set({ usedAt: sql`NOW(3)` }).where(eq(otpTokens.id, id))
  }
  private token(row: typeof otpTokens.$inferSelect): OtpToken {
    return { id: row.id, memberId: row.memberId, tokenHash: row.tokenHash, purpose: row.purpose as OtpPurpose, expiresAt: row.expiresAt, usedAt: row.usedAt, failedAttempts: row.failedAttempts, lockedUntil: row.lockedUntil, createdAt: row.createdAt }
  }
}
