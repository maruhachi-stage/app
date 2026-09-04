import { afterAll, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { mysqlPool } from '../../src/infrastructure/database/mysqlPool.js'

describe('back-api integration', () => {
  afterAll(async () => {
    await mysqlPool.end()
  })

  it('returns the health status through the Hono app', async () => {
    const response = await app.request('/api/v1/health')

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ status: 'ok' })
  })

  it('reads movies from the migrated MySQL database', async () => {
    const response = await app.request('/api/movies')
    const body = (await response.json()) as { data?: { items?: unknown[] } }

    expect(response.status).toBe(200)
    expect(Array.isArray(body.data?.items)).toBe(true)
  })
})
