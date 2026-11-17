import { createApp } from '#app.js'
import { createDatabase } from '#infrastructure/database/database.js'
import { seedSchedules } from '#infrastructure/database/seedSchedules.js'
import type { Env } from '#types.js'

const app = createApp()

/**
 * Cloudflare Workers entry point. The fetch handler serves the Hono app and the
 * scheduled handler keeps the next 7 days of schedules populated.
 */
export default {
  fetch: app.fetch,
  scheduled(_controller, env, ctx) {
    ctx.waitUntil(seedSchedules(createDatabase(env)))
  },
} satisfies ExportedHandler<Env>
