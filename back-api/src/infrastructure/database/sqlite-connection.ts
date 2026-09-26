import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { drizzle } from 'drizzle-orm/node-sqlite'
import { resolveDatabasePath } from './database-path.js'

export function openSqliteDatabase(filePath: string) {
  const databasePath = resolveDatabasePath(filePath)
  if (databasePath !== ':memory:') {
    mkdirSync(path.dirname(databasePath), { recursive: true })
  }

  const client = new DatabaseSync(databasePath)
  client.exec('PRAGMA foreign_keys = ON')
  client.exec('PRAGMA journal_mode = WAL')
  client.exec('PRAGMA busy_timeout = 5000')

  return {
    client,
    db: drizzle({ client }),
  }
}
