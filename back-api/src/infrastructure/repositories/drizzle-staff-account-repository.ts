import { desc, eq } from 'drizzle-orm'
import { db } from '#infrastructure/database/sqlite.js'
import { staffAccounts } from '#infrastructure/database/schema.js'
import type { StaffAccount, StaffAccountWithPassword } from '#domain/entities/staff-account.js'
import type {
  CreateStaffAccountInput,
  StaffAccountRepository,
  UpdateStaffAccountInput,
} from '#domain/interfaces/repositories/staff-account-repository.js'

type StaffAccountRow = typeof staffAccounts.$inferSelect

export class DrizzleStaffAccountRepository implements StaffAccountRepository {
  async findById(id: number): Promise<StaffAccountWithPassword | null> {
    const [row] = await db.select().from(staffAccounts).where(eq(staffAccounts.id, id)).limit(1)
    return row ? this.withPassword(row) : null
  }

  async findByUserId(userId: string): Promise<StaffAccountWithPassword | null> {
    const [row] = await db
      .select()
      .from(staffAccounts)
      .where(eq(staffAccounts.userId, userId))
      .limit(1)
    return row ? this.withPassword(row) : null
  }

  async findAll(): Promise<StaffAccount[]> {
    const rows = await db.select().from(staffAccounts).orderBy(desc(staffAccounts.createdAt))
    return rows.map((row) => this.account(row))
  }

  async create(input: CreateStaffAccountInput): Promise<number> {
    const row = await db
      .insert(staffAccounts)
      .values(input)
      .returning({ id: staffAccounts.id })
      .get()
    if (!row) throw new Error('Failed to create staff account')
    return row.id
  }

  async update(id: number, input: UpdateStaffAccountInput): Promise<void> {
    await db.update(staffAccounts).set(input).where(eq(staffAccounts.id, id))
  }

  async updatePasswordHash(id: number, passwordHash: string): Promise<void> {
    await db.update(staffAccounts).set({ passwordHash }).where(eq(staffAccounts.id, id))
  }

  async recordLoginFailure(
    id: number,
    failedLoginCount: number,
    lockedUntil: Date | null,
  ): Promise<void> {
    await db
      .update(staffAccounts)
      .set({ failedLoginCount, lockedUntil })
      .where(eq(staffAccounts.id, id))
  }

  async recordLoginSuccess(id: number, lastLoginAt: Date): Promise<void> {
    await db
      .update(staffAccounts)
      .set({ failedLoginCount: 0, lockedUntil: null, lastLoginAt })
      .where(eq(staffAccounts.id, id))
  }

  private account(row: StaffAccountRow): StaffAccount {
    return {
      id: row.id,
      userId: row.userId,
      displayName: row.displayName,
      email: row.email,
      roleId: row.roleId,
      status: row.status,
      failedLoginCount: row.failedLoginCount,
      lockedUntil: row.lockedUntil,
      lastLoginAt: row.lastLoginAt,
    }
  }

  private withPassword(row: StaffAccountRow): StaffAccountWithPassword {
    return { ...this.account(row), passwordHash: row.passwordHash }
  }
}
