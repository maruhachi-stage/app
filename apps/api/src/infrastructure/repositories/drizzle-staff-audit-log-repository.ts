import type { Database } from '#infrastructure/database/database.js'
import { staffAuditLogs } from '#infrastructure/database/schema.js'
import type {
  StaffAuditLogInput,
  StaffAuditLogRepository,
} from '#domain/interfaces/repositories/staff-audit-log-repository.js'

export class DrizzleStaffAuditLogRepository implements StaffAuditLogRepository {
  constructor(private readonly db: Database) {}

  async record(input: StaffAuditLogInput): Promise<void> {
    await this.db.insert(staffAuditLogs).values({
      staffAccountId: input.staffAccountId,
      action: input.action,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      requestId: input.requestId,
      ipAddress: input.ipAddress,
    })
  }
}
