import { SELF } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'

const ORIGIN = 'http://localhost:3030'

function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return SELF.fetch(`${ORIGIN}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ORIGIN, ...headers },
    body: JSON.stringify(body),
  })
}

describe('public API', () => {
  it('returns health status', async () => {
    const res = await SELF.fetch(`${ORIGIN}/api/v1/health`)
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ status: 'ok' })
  })

  it('lists movies with proxied thumbnail URLs', async () => {
    const res = await SELF.fetch(`${ORIGIN}/api/movies`)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { data: { items: { id: number; thumbnailUrl: string }[] } }
    expect(body.data.items.length).toBeGreaterThan(0)
    expect(body.data.items[0]?.thumbnailUrl).toMatch(/\/images\//)
  })

  it('returns a movie detail', async () => {
    const res = await SELF.fetch(`${ORIGIN}/api/movies/1`)
    expect(res.status).toBe(200)
  })

  it('returns schedules for a movie', async () => {
    const res = await SELF.fetch(`${ORIGIN}/api/movies/1/schedules`)
    expect(res.status).toBe(200)
  })

  it('returns the public config', async () => {
    const res = await SELF.fetch(`${ORIGIN}/api/config`)
    expect(res.status).toBe(200)
  })

  it('returns the seat layout of a schedule', async () => {
    const res = await SELF.fetch(`${ORIGIN}/api/reservations/schedules/9001/seats`)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { data: { seats: unknown[] } }
    expect(Array.isArray(body.data.seats)).toBe(true)
  })

  it('answers 404 for an unknown reservation code', async () => {
    const res = await SELF.fetch(`${ORIGIN}/api/reservations/ZZZZZZZZ`)
    expect(res.status).toBe(404)
  })

  it('answers 404 for an unknown image key', async () => {
    const res = await SELF.fetch(`${ORIGIN}/images/does-not-exist.jpg`)
    expect(res.status).toBe(404)
  })

  it('reports an unauthenticated session', async () => {
    const res = await SELF.fetch(`${ORIGIN}/api/auth/me`)
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ data: { authenticated: false } })
  })

  it('creates a member and rejects invalid OTP payloads', async () => {
    const created = await post('/api/members', {
      email: 'integration@example.com',
      name: 'Integration',
    })
    expect(created.status).toBe(201)

    const invalid = await post('/api/auth/otp/send', { email: 'integration@example.com' })
    expect(invalid.status).toBe(400)
  })

  it('rejects a reserved hold request with an invalid body', async () => {
    const res = await post('/api/reservations/hold', { scheduleId: 9001, seatIds: [] })
    expect(res.status).toBe(400)
  })

  it('blocks form submissions from another origin', async () => {
    const res = await SELF.fetch(`${ORIGIN}/api/members`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        origin: 'https://evil.example.com',
      },
      body: 'email=csrf%40example.com',
    })
    expect(res.status).toBe(403)
  })

  it('rejects a staff login with unknown credentials', async () => {
    const res = await SELF.fetch(`${ORIGIN}/api/v1/staff/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost:3040' },
      body: JSON.stringify({ userId: 'nobody', password: 'wrong-password-123' }),
    })
    expect(res.status).toBe(401)
  })
})
