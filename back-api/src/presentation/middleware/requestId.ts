import type { MiddlewareHandler } from 'hono'
import type { AppEnv } from '#types.js'
import { randomUUID } from 'crypto'

export const requestIdMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const requestId = `req_${randomUUID().replace(/-/g, '').slice(0, 20)}`
  c.set('requestId', requestId)
  c.header('X-Request-ID', requestId)
  await next()
}
