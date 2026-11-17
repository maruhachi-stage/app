import { defineConfig } from 'vitest/config'
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin'

/**
 * Runs the API integration tests inside the Workers runtime with a real local
 * D1 database, so the tests exercise the same bindings and SQL dialect as
 * production.
 */
export default defineConfig(async () => {
  const migrations = await readD1Migrations('d1/migrations')

  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: './wrangler.jsonc' },
        miniflare: {
          bindings: {
            TEST_MIGRATIONS: migrations,
            CORS_ORIGIN: 'http://localhost:3030,http://localhost:3040',
            ENVIRONMENT: 'development',
          },
        },
      }),
    ],
    test: {
      include: ['test/workers/**/*.test.ts'],
      setupFiles: ['./test/workers/setup.ts'],
    },
  }
})
