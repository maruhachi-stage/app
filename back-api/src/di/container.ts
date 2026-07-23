import { mysqlPool } from '#infrastructure/database/mysqlPool.js'

/**
 * Composition root dependencies. Feature services are added here as they are
 * migrated, keeping framework and database construction out of application code.
 */
export const container = {
  mysqlPool,
}
