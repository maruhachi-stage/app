import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

const host = process.env.DB_HOST ?? 'localhost'
const port = Number(process.env.DB_PORT ?? process.env.MYSQL_PORT ?? 3306)
const user = process.env.DB_USER ?? 'hal_user'
const password = process.env.DB_PASSWORD ?? 'hal_pass'
const database = process.env.DB_NAME ?? 'hal_cinema'

export default defineConfig({
  dialect: 'mysql',
  schema: './src/infrastructure/database/schema.ts',
  out: './migrations',
  dbCredentials: {
    url: `mysql://${user}:${password}@${host}:${port}/${database}`,
  },
})
