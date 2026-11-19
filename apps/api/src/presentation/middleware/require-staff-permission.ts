import type { MiddlewareHandler } from 'hono'
import type { AppEnv } from '#types.js'
import { hasStaffPermission, type StaffPermission } from '#domain/entities/staff-account.js'
import { AppError } from '#domain/errors/appError.js'

export function requireStaffPermission(permission: StaffPermission): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const session = c.get('staffSession')
    if (!session) throw new AppError('UNAUTHORIZED', 'Staff authentication required')
    if (!hasStaffPermission(session.roleId, permission)) {
      throw new AppError('FORBIDDEN', 'Insufficient staff permission')
    }
    await next()
  }
}
