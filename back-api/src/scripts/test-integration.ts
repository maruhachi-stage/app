import 'dotenv/config'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import {
  removeSqliteDatabaseFiles,
  resolveDatabasePath,
} from '../infrastructure/database/database-path.js'
import { migrateSqliteDatabase } from '../infrastructure/database/migrate.js'

const testDatabasePath = resolveDatabasePath(process.env.DB_TEST_FILE ?? './data/test.db')
process.env.NODE_ENV = 'test'
process.env.DB_TEST_FILE = testDatabasePath
process.env.DB_FILE = testDatabasePath

removeSqliteDatabaseFiles(testDatabasePath)

try {
  migrateSqliteDatabase(testDatabasePath)
  const vitestCli = path.resolve(process.cwd(), 'node_modules/vitest/vitest.mjs')
  const result = spawnSync(
    process.execPath,
    [vitestCli, 'run', '--config=vitest.integration.config.ts'],
    {
      env: {
        ...process.env,
        NODE_ENV: 'test',
        DB_TEST_FILE: testDatabasePath,
        DB_FILE: testDatabasePath,
      },
      stdio: 'inherit',
    },
  )

  if (result.error) throw result.error
  process.exitCode = result.status ?? 1
} finally {
  removeSqliteDatabaseFiles(testDatabasePath)
}
