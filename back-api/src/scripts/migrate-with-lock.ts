import 'dotenv/config'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import mysql from 'mysql2/promise'

const LOCK_NAME = 'hal_cinema_schema_migration'

const connection = await mysql.createConnection({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? process.env.MYSQL_PORT ?? 3306),
  user: process.env.DB_USER ?? 'hal_user',
  password: process.env.DB_PASSWORD ?? 'hal_pass',
  database: process.env.DB_NAME ?? 'hal_cinema',
})

let lockAcquired = false

try {
  const [rows] = (await connection.query('SELECT GET_LOCK(?, 0) AS acquired', [LOCK_NAME])) as [
    Array<{ acquired: number | null }>,
    unknown,
  ]
  lockAcquired = rows[0]?.acquired === 1

  if (!lockAcquired) {
    console.error('別のmigrationが実行中です。完了してから再実行してください。')
    process.exitCode = 2
  } else {
    const drizzleKit = resolve('node_modules/drizzle-kit/bin.cjs')
    const result = spawnSync(process.execPath, [drizzleKit, 'migrate'], {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'inherit',
    })

    if (result.error) {
      throw result.error
    }

    process.exitCode = result.status ?? 1
  }
} finally {
  if (lockAcquired) {
    await connection.query('SELECT RELEASE_LOCK(?)', [LOCK_NAME])
  }
  await connection.end()
}
