/**
 * Writes `d1/seed.sql` from the master data defined in
 * `src/infrastructure/database/seed-data.ts`.
 *
 * Apply the result with
 *   npx wrangler d1 execute hal-cinema --local  --file=d1/seed.sql
 *   npx wrangler d1 execute hal-cinema --remote --file=d1/seed.sql
 *
 * Usage: npm run db:seed:export
 */
import fs from 'node:fs'
import path from 'node:path'
import { renderSeedSql } from '#infrastructure/database/seed-data.js'

const root = path.resolve(import.meta.dirname, '..')
const target = path.join(root, 'd1', 'seed.sql')

fs.mkdirSync(path.dirname(target), { recursive: true })
fs.writeFileSync(target, renderSeedSql(), 'utf8')
console.log(`[db:seed:export] ${path.relative(root, target)} を書き出しました`)
