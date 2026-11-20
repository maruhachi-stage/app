import type {
  StaffAccount,
  StaffAccountStatus,
  StaffAccountWithPassword,
} from '#domain/entities/staff-account.js'

export type CreateStaffAccountInput = {
  userId: string
  displayName: string
  email: string
  passwordHash: string
  roleId: number
}

export type UpdateStaffAccountInput = {
  displayName?: string
  email?: string
  userId?: string
  roleId?: number
  status?: StaffAccountStatus
}

export interface StaffAccountRepository {
  findById(id: number): Promise<StaffAccountWithPassword | null>
  findByUserId(userId: string): Promise<StaffAccountWithPassword | null>
  findAll(): Promise<StaffAccount[]>
  create(input: CreateStaffAccountInput): Promise<number>
  update(id: number, input: UpdateStaffAccountInput): Promise<void>
  updatePasswordHash(id: number, passwordHash: string): Promise<void>
  recordLoginFailure(id: number, failedLoginCount: number, lockedUntil: Date | null): Promise<void>
  recordLoginSuccess(id: number, lastLoginAt: Date): Promise<void>
}
