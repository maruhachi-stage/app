/**
 * Dumps the master data (catalog rows) of the local SQLite database into
 * `d1/seed.sql`, so a fresh D1 database can be populated with
 *
 *   npx wrangler d1 execute hal-cinema --local --file=d1/seed.sql
 *
 * Transactional tables (reservations, members, sessions, POS sales, generated
 * schedules) are intentionally skipped: those rows are produced at runtime.
 *
 * Usage: node scripts/export-d1-seed.mjs [source.db]
 */
import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const root = path.resolve(import.meta.dirname, '..')
const sourcePath = path.resolve(root, process.argv[2] ?? 'data/app.db')
const targetPath = path.join(root, 'd1', 'seed.sql')

/** Inserted in this order so that referenced rows exist first. */
const TABLES = [
  'images',
  'screens',
  'screen_seat_layouts',
  'seats',
  'screenings',
  'products',
  'product_notes',
  'product_option_groups',
  'product_options',
  'pos_products',
]

if (!fs.existsSync(sourcePath)) {
  console.error(`[export-d1-seed] ${sourcePath} が見つかりません`)
  process.exit(1)
}

const db = new DatabaseSync(sourcePath, { readOnly: true })

function quoteIdent(name) {
  return `"${name.replaceAll('"', '""')}"`
}

function quoteValue(value) {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL'
  if (typeof value === 'bigint') return value.toString()
  if (value instanceof Uint8Array) return `X'${Buffer.from(value).toString('hex')}'`
  return `'${String(value).replaceAll("'", "''")}'`
}

const lines = [
  '-- 自動生成ファイル: scripts/export-d1-seed.mjs がローカル SQLite から出力します。',
  '-- 手で編集しないでください。マスタデータを変更したらスクリプトを再実行します。',
  '',
]

const existing = new Set(
  db
    .prepare("select name from sqlite_master where type='table'")
    .all()
    .map((row) => row.name),
)

for (const table of TABLES) {
  if (!existing.has(table)) {
    console.warn(`[export-d1-seed] ${table} が無いためスキップします`)
    continue
  }
  const columns = db
    .prepare(`pragma table_info(${quoteIdent(table)})`)
    .all()
    .map((column) => column.name)
  const rows = db.prepare(`select * from ${quoteIdent(table)}`).all()
  if (rows.length === 0) continue

  const columnList = columns.map(quoteIdent).join(', ')
  lines.push(`-- ${table} (${rows.length} rows)`)
  for (const row of rows) {
    const values = columns.map((column) => quoteValue(row[column])).join(', ')
    lines.push(`INSERT OR IGNORE INTO ${quoteIdent(table)} (${columnList}) VALUES (${values});`)
  }
  lines.push('')
  console.log(`[export-d1-seed] ${table}: ${rows.length} rows`)
}

fs.mkdirSync(path.dirname(targetPath), { recursive: true })
fs.writeFileSync(targetPath, `${lines.join('\n')}\n`, 'utf8')
console.log(`[export-d1-seed] ${path.relative(root, targetPath)} を書き出しました`)
