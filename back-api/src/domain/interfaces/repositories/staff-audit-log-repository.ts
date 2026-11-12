export type StaffAuditLogInput = {
  staffAccountId: number | null
  action: string
  targetType?: string
  targetId?: string
  requestId: string
  ipAddress: string | null
}

export interface StaffAuditLogRepository {
  record(input: StaffAuditLogInput): Promise<void>
}
