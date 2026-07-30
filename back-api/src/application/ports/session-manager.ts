import type { SessionData } from '#types.js'

/** HTTP cookie concerns stay in Presentation; this port allows the session store to be replaced. */
export interface SessionManager {
  create(data: SessionData): string
  destroy(sessionId: string): void
}
