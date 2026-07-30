import type { MiddlewareHandler } from 'hono'
import type { AppEnv } from '#types.js'

export const auditLogMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  await next()
  // 個人情報（メール・氏名）はログに含めない
  const log = {
    requestId: c.get('requestId') ?? 'unknown',
    memberId: c.get('session')?.memberId ?? null,
    ip: c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown',
    userAgent: c.req.header('user-agent') ?? '',
    endpoint: `${c.req.method} ${new URL(c.req.url).pathname}`,
    status: c.res.status,
    ts: new Date().toISOString(),
  }
  console.log('[AUDIT]', JSON.stringify(log))
}
