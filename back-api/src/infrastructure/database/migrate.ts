import 'dotenv/config'
import { migrate } from 'drizzle-orm/node-sqlite/migrator'
import path from 'node:path'
import { getConfiguredDatabasePath } from './database-path.js'
import { openSqliteDatabase } from './sqlite-connection.js'

export function migrateSqliteDatabase(databasePath = getConfiguredDatabasePath()): void {
  const { client, db } = openSqliteDatabase(databasePath)
  try {
    migrate(db, { migrationsFolder: path.resolve(process.cwd(), 'migrations') })
  } finally {
    client.close()
  }
}
