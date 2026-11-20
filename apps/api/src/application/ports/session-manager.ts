import type { SessionData } from '#types.js'

/** HTTP cookie concerns stay in Presentation; this port allows the session store to be replaced. */
export interface SessionManager {
  find(sessionId: string): Promise<SessionData | null>
  create(data: SessionData): Promise<string>
  destroy(sessionId: string): Promise<void>
}
