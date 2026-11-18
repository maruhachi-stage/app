/**
 * Runs the Worker's `scheduled` handler against the running `wrangler dev`.
 *
 * Schedules are generated data, not master data, so they are not part of
 * `d1/seed.sql`: the production Worker creates them from Cron Triggers, and
 * locally the same handler is triggered with this script instead of waiting for
 * 0:00 JST.
 *
 * Usage: npm run dev (別ターミナル) → npm run schedules:local
 */
const base = process.env.API_BASE_URL ?? 'http://127.0.0.1:3080'

const response = await fetch(`${base}/cdn-cgi/local/scheduled`)
if (!response.ok) {
  console.error(`[schedules:local] ${base} の scheduled 実行に失敗しました (${response.status})`)
  process.exit(1)
}

console.log(`[schedules:local] ${base} で scheduled ハンドラを実行しました`)
