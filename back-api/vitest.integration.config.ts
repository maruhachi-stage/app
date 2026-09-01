import { defineConfig } from 'vitest/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '#': path.resolve(projectRoot, 'src'),
    },
  },
  test: {
    include: ['test/integration/**/*.test.ts'],
    exclude: ['**/node_modules/**'],
    sequence: { concurrent: false },
    testTimeout: 30000,
    hookTimeout: 30000,
  },
})
