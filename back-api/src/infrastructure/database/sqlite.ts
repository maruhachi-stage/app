import { getConfiguredDatabasePath } from './database-path.js'
import { openSqliteDatabase } from './sqlite-connection.js'

const connection = openSqliteDatabase(getConfiguredDatabasePath())

export const sqlite = connection.client
export const db = connection.db

export function closeDatabase(): void {
  sqlite.close()
}
