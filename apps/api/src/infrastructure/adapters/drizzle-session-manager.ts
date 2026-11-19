import { eq } from 'drizzle-orm'
import type { SessionManager } from '#application/ports/session-manager.js'
import type { Database } from '#infrastructure/database/database.js'
import { sessions } from '#infrastructure/database/schema.js'
import type { SessionData } from '#types.js'

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Customer sessions are persisted in D1: a Worker isolate can be evicted at any
 * time, so in-memory state would lose the login on the next request.
 */
export class DrizzleSessionManager implements SessionManager {
  constructor(private readonly db: Database) {}

  async find(sessionId: string): Promise<SessionData | null> {
    const row = await this.db.select().from(sessions).where(eq(sessions.id, sessionId)).get()
    if (!row) return null
    if (row.expiresAt.getTime() <= Date.now()) {
      await this.destroy(sessionId)
      return null
    }
    return JSON.parse(row.data) as SessionData
  }

  async create(data: SessionData): Promise<string> {
    const id = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS)
    await this.db.insert(sessions).values({ id, data: JSON.stringify(data), expiresAt })
    return id
  }

  async destroy(sessionId: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.id, sessionId))
  }
}
