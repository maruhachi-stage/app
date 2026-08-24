import type { container } from '#di/container.js'

export type SessionData = {
  memberId: number
}

export type StaffSessionData = { staffId: number; roleId: number; userId: string }

export type AppEnv = {
  Variables: {
    requestId: string
    session: SessionData | null
    staffSession: StaffSessionData | null
    container: typeof container
  }
}
