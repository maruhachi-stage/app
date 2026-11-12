/** Role catalog. Role IDs are stored in staff_accounts.role_id and must stay stable. */
export const STAFF_ROLES = {
  viewer: { id: 10, name: '閲覧者', permissions: ['staff.overview.read'] },
  editor: {
    id: 20,
    name: '編集者',
    permissions: ['staff.overview.read', 'staff.content.write'],
  },
  administrator: {
    id: 99,
    name: '管理者',
    permissions: ['staff.overview.read', 'staff.content.write', 'staff.accounts.manage'],
  },
} as const

export type StaffPermission =
  'staff.overview.read' | 'staff.content.write' | 'staff.accounts.manage'

export type StaffRole = {
  id: number
  name: string
  permissions: readonly StaffPermission[]
}

export type StaffAccountStatus = 'active' | 'suspended'

export type StaffAccount = {
  id: number
  userId: string
  displayName: string
  email: string
  roleId: number
  status: StaffAccountStatus
  failedLoginCount: number
  lockedUntil: Date | null
  lastLoginAt: Date | null
}

export type StaffAccountWithPassword = StaffAccount & {
  passwordHash: string
}

export type StaffSessionContext = {
  staffId: number
  roleId: number
  userId: string
}

export type StaffOtpChallenge = {
  id: number
  staffAccountId: number
  otpHash: string
  expiresAt: Date
  usedAt: Date | null
  failedAttempts: number
}

export function getStaffRole(roleId: number): StaffRole | undefined {
  return Object.values(STAFF_ROLES).find((role) => role.id === roleId)
}

export function hasStaffPermission(roleId: number, permission: StaffPermission): boolean {
  return getStaffRole(roleId)?.permissions.includes(permission) ?? false
}
