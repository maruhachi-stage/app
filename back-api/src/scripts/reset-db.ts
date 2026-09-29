import 'dotenv/config'
import {
  getConfiguredDatabasePath,
  removeSqliteDatabaseFiles,
} from '../infrastructure/database/database-path.js'
import { migrateSqliteDatabase } from '../infrastructure/database/migrate.js'

const databasePath = getConfiguredDatabasePath()
removeSqliteDatabaseFiles(databasePath)
migrateSqliteDatabase(databasePath)
console.log('SQLite database reset and migrated: ' + databasePath)
