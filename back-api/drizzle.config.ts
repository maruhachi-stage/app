import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/infrastructure/database/schema.ts',
  out: './migrations',
  dbCredentials: {
    url: process.env.DB_FILE ?? './data/app.db',
  },
})
