import type { createContainer } from '#di/container.js'
import type { StaffSessionContext } from '#domain/entities/staff-account.js'

export type SessionData = {
  memberId: number
}

/**
 * Cloudflare bindings and environment variables. Values are resolved per
 * request from `c.env` so that the Worker never depends on module scope state.
 */
export type Env = {
  DB: D1Database
  IMAGES: R2Bucket
  CORS_ORIGIN?: string
  RESEND_API_KEY?: string
  RESEND_FROM_EMAIL?: string
  ENVIRONMENT?: 'development' | 'production'
}

export type AppEnv = {
  Bindings: Env
  Variables: {
    requestId: string
    session: SessionData | null
    staffSession: (StaffSessionContext & { sessionToken: string }) | null
    staffChallengeToken: string | null
    container: ReturnType<typeof createContainer>
  }
}
