/**
 * Copies drizzle-kit migrations into the flat layout that
 * `wrangler d1 migrations apply` understands.
 *
 *   migrations/<timestamp>_<name>/migration.sql  ->  d1/migrations/<timestamp>_<name>.sql
 *
 * Drizzle Kit remains the single source of truth; this script only bridges the
 * directory layout difference.
 */
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const sourceDir = path.join(root, 'migrations')
const targetDir = path.join(root, 'd1', 'migrations')

if (!fs.existsSync(sourceDir)) {
  console.error(`[export-d1-migrations] ${sourceDir} が見つかりません`)
  process.exit(1)
}

fs.mkdirSync(targetDir, { recursive: true })

const entries = fs
  .readdirSync(sourceDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()

let copied = 0
for (const dir of entries) {
  const sqlPath = path.join(sourceDir, dir, 'migration.sql')
  if (!fs.existsSync(sqlPath)) continue
  const targetPath = path.join(targetDir, `${dir}.sql`)
  fs.copyFileSync(sqlPath, targetPath)
  console.log(`[export-d1-migrations] ${dir}.sql`)
  copied++
}

if (copied === 0) {
  console.warn('[export-d1-migrations] migration.sql が見つかりませんでした')
} else {
  console.log(
    `[export-d1-migrations] ${copied} 件を ${path.relative(root, targetDir)} へ書き出しました`,
  )
}
