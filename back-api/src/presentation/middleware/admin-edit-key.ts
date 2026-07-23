import type { Context, Next } from 'hono'
import { AppError } from '#domain/errors/appError.js'
import type { AppEnv } from '#types.js'

const adminEditKeyHeader = 'x-admin-edit-key'

export function isAdminEditKeyConfigured(): boolean {
  return Boolean(process.env.ADMIN_EDIT_KEY)
}

export function hasValidAdminEditKey(c: Context<AppEnv>): boolean {
  const configuredKey = process.env.ADMIN_EDIT_KEY
  return configuredKey !== undefined && c.req.header(adminEditKeyHeader) === configuredKey
}

export async function requireAdminEditKey(c: Context<AppEnv>, next: Next): Promise<void> {
  if (!isAdminEditKeyConfigured()) {
    throw new AppError('FORBIDDEN', 'Admin edit key is not configured')
  }
  if (!hasValidAdminEditKey(c)) {
    throw new AppError('FORBIDDEN', 'Invalid admin edit key')
  }

  await next()
}
