import { applyD1Migrations, env as testEnv } from 'cloudflare:test'
import type { D1Migration } from '@cloudflare/vitest-plugin'
import type { Env } from '../../src/types.js'
import seedSql from '../../d1/seed.sql?raw'

const env = testEnv as unknown as Env & { TEST_MIGRATIONS: D1Migration[] }

/**
 * Prepares the isolated per-test D1 database: schema from the same migrations as
 * production, master data from `d1/seed.sql`, and a bookable schedule.
 */
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)
await env.DB.exec(seedSql)

const scheduleId = 9001
const startsAt = Date.UTC(2027, 0, 2, 1, 0, 0)
const endsAt = startsAt + 2 * 60 * 60 * 1000

await env.DB.exec(
  `INSERT INTO schedules (id, screening_id, screen_id, starts_at, ends_at, is_public) VALUES (${scheduleId}, 1, 1, ${startsAt}, ${endsAt}, 1)`,
)
