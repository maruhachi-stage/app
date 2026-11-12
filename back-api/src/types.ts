import type { container } from '#di/container.js'
import type { StaffSessionContext } from '#domain/entities/staff-account.js'

export type SessionData = {
  memberId: number
}

export type AppEnv = {
  Variables: {
    requestId: string
    session: SessionData | null
    staffSession: (StaffSessionContext & { sessionToken: string }) | null
    staffChallengeToken: string | null
    container: typeof container
  }
}
