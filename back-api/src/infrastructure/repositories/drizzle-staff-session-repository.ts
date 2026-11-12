import { and, eq, gt, isNull } from 'drizzle-orm'
import { db } from '#infrastructure/database/sqlite.js'
import { staffAccounts, staffSessions } from '#infrastructure/database/schema.js'
import type { StaffSessionContext } from '#domain/entities/staff-account.js'
import type { StaffSessionRepository } from '#domain/interfaces/repositories/staff-session-repository.js'

export class DrizzleStaffSessionRepository implements StaffSessionRepository {
  async create(input: {
    tokenHash: string
    staffAccountId: number
    expiresAt: Date
    ipAddress: string | null
    userAgent: string | null
  }): Promise<void> {
    await db.insert(staffSessions).values(input)
  }

  async findActiveByTokenHash(tokenHash: string, now: Date): Promise<StaffSessionContext | null> {
    const [row] = await db
      .select({
        id: staffAccounts.id,
        roleId: staffAccounts.roleId,
        userId: staffAccounts.userId,
        sessionId: staffSessions.id,
      })
      .from(staffSessions)
      .innerJoin(staffAccounts, eq(staffSessions.staffAccountId, staffAccounts.id))
      .where(
        and(
          eq(staffSessions.tokenHash, tokenHash),
          isNull(staffSessions.revokedAt),
          gt(staffSessions.expiresAt, now),
          eq(staffAccounts.status, 'active'),
        ),
      )
      .limit(1)
    if (!row) return null
    return { staffId: row.id, roleId: row.roleId, userId: row.userId }
  }

  async revokeByTokenHash(tokenHash: string, revokedAt: Date): Promise<void> {
    await db
      .update(staffSessions)
      .set({ revokedAt })
      .where(and(eq(staffSessions.tokenHash, tokenHash), isNull(staffSessions.revokedAt)))
  }
}
