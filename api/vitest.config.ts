import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin'
import { defineConfig } from 'vitest/config'

/**
 * One test setup for every test: unit tests and API integration tests both run
 * inside the Workers runtime with the real bindings, so nothing is validated
 * against a runtime that production does not use.
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
      include: ['src/**/*.test.ts', 'test/workers/**/*.test.ts'],
      setupFiles: ['./test/workers/setup.ts'],
    },
  }
})
