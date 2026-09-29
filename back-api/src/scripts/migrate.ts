import 'dotenv/config'
import { getConfiguredDatabasePath } from '../infrastructure/database/database-path.js'
import { migrateSqliteDatabase } from '../infrastructure/database/migrate.js'

const databasePath = getConfiguredDatabasePath()
migrateSqliteDatabase(databasePath)
console.log('SQLite migrations applied: ' + databasePath)
