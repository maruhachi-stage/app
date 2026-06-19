import type { Context, Next } from 'hono'
import { AppError } from '#lib/errors.js'
import type { AppEnv } from '#types.js'

const ADMIN_EDIT_KEY_HEADER = 'x-admin-edit-key'

export function isAdminEditKeyConfigured() {
  return Boolean(process.env.ADMIN_EDIT_KEY)
}

export function hasValidAdminEditKey(c: Context<AppEnv>) {
  const configuredKey = process.env.ADMIN_EDIT_KEY
  if (!configuredKey) return false

  return c.req.header(ADMIN_EDIT_KEY_HEADER) === configuredKey
}

export async function requireAdminEditKey(c: Context<AppEnv>, next: Next) {
  if (!isAdminEditKeyConfigured()) {
    throw new AppError('FORBIDDEN', 'Admin edit key is not configured')
  }
  if (!hasValidAdminEditKey(c)) {
    throw new AppError('FORBIDDEN', 'Invalid admin edit key')
  }

  await next()
}
