import type { MiddlewareHandler } from 'hono'
import type { AppEnv } from '#types.js'
import type { StaffPermission } from '#config/staff-roles.js'
import { getStaffRole } from '#config/staff-roles.js'
import { AppError } from '#lib/errors.js'

export const requireStaffPermission = (permission: StaffPermission): MiddlewareHandler<AppEnv> => async (c, next) => {
  const session = c.get('staffSession')
  if (!session) throw new AppError('UNAUTHORIZED', 'Staff authentication required')
  if (!getStaffRole(session.roleId)?.permissions.includes(permission)) throw new AppError('FORBIDDEN', 'Insufficient staff permission')
  await next()
}
