export const STAFF_ROLES = {
  viewer: { id: 10, name: '閲覧者', permissions: ['staff.overview.read'] },
  editor: { id: 20, name: '編集者', permissions: ['staff.overview.read', 'staff.content.write'] },
  administrator: { id: 99, name: '管理者', permissions: ['staff.overview.read', 'staff.content.write', 'staff.accounts.manage'] },
} as const

export type StaffPermission = 'staff.overview.read' | 'staff.content.write' | 'staff.accounts.manage'

export function getStaffRole(roleId: number): { id: number; name: string; permissions: readonly StaffPermission[] } | undefined {
  return Object.values(STAFF_ROLES).find((role) => role.id === roleId)
}
