export type StaffRole = {
    id: number
    key: string
    name: string
    permissions: string[]
}

export type AuthenticatedStaff = {
    id: number
    userId: string
    displayName: string
    role: StaffRole
}

export type LoginResult = {
    otpRequired: true
    expiresInSec: number
}

/** Permissions are compared by name so the frontend never duplicates role definitions. */
export const STAFF_PERMISSIONS = {
    overviewRead: 'staff.overview.read',
    contentWrite: 'staff.content.write',
    accountsManage: 'staff.accounts.manage',
} as const

export function can(staff: AuthenticatedStaff | null, permission: string): boolean {
    return staff?.role.permissions.includes(permission) ?? false
}
