import { randomUUID } from 'crypto'
import type { SessionManager } from '#application/ports/session-manager.js'
import type { SessionData } from '#types.js'

/** Store adapter only. Cookie reading/writing remains a Presentation responsibility. */
export class InMemorySessionManager implements SessionManager {
  private readonly sessions = new Map<string, { data: SessionData; expiresAt: number }>()
  create(data: SessionData): string {
    const id = randomUUID()
    this.sessions.set(id, { data, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 })
    return id
  }
  destroy(sessionId: string): void { this.sessions.delete(sessionId) }
}
