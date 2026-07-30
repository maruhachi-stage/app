import type { container } from '#di/container.js'

export type SessionData = {
  memberId: number
}

export type AppEnv = {
  Variables: {
    requestId: string
    session: SessionData | null
    container: typeof container
  }
}
