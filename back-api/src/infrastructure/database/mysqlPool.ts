import mysql from 'mysql2/promise'
import { drizzle } from 'drizzle-orm/mysql2'
import * as schema from '#infrastructure/database/schema.js'

export const mysqlPool = mysql.createPool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? process.env.MYSQL_PORT ?? 3306),
  user: process.env.DB_USER ?? 'hal_user',
  password: process.env.DB_PASSWORD ?? 'hal_pass',
  database: process.env.DB_NAME ?? 'hal_cinema',
  timezone: '+00:00',
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
})

/**
 * Typed Drizzle access point. The mysql2 pool remains available during the
 * staged migration for MySQL-specific locking queries and transactions.
 */
export const db = drizzle(mysqlPool, { schema, mode: 'default' })
