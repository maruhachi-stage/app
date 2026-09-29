import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { eq } from 'drizzle-orm'
import { AuthService } from '../../src/application/services/auth-service.js'
import { db, closeDatabase } from '../../src/infrastructure/database/sqlite.js'
import {
  posProducts,
  schedules,
  screenSeatLayouts,
  screenings,
  screens,
  seats,
} from '../../src/infrastructure/database/schema.js'
import { ensurePosSchema } from '../../src/infrastructure/database/pos-initializer.js'
import { ensureProductCatalogSchema } from '../../src/infrastructure/database/product-catalog-initializer.js'
import { DrizzleMemberRepository } from '../../src/infrastructure/repositories/drizzle-member-repository.js'
import { DrizzleMovieRepository } from '../../src/infrastructure/repositories/drizzle-movie-repository.js'
import { DrizzleOtpTokenRepository } from '../../src/infrastructure/repositories/drizzle-otp-token-repository.js'
import { DrizzlePosRepository } from '../../src/infrastructure/repositories/drizzle-pos-repository.js'
import { DrizzleReservationRepository } from '../../src/infrastructure/repositories/drizzle-reservation-repository.js'
import { DrizzleStageRepository } from '../../src/infrastructure/repositories/drizzle-stage-repository.js'
import { jstDateUtcRange } from '../../src/lib/jst-date-range.js'

const screeningDate = '2026-09-25'
let screenId: number
let seatLayoutId: number
let movieId: number
let stageId: number
let movieScheduleId: number
let movieSeatId: number

describe('back-api SQLite integration', () => {
  beforeAll(async () => {
    const screen = await db
      .insert(screens)
      .values({ name: 'Integration Screen', size: 'large', totalSeats: 2 })
      .returning({ id: screens.id })
      .get()
    if (!screen) throw new Error('Failed to create integration screen')
    screenId = screen.id

    const layout = await db
      .insert(screenSeatLayouts)
      .values({
        screenId,
        layoutVersion: 1,
        backgroundImageUrl: '/integration-layout.png',
        aspectRatioWidth: 16,
        aspectRatioHeight: 9,
      })
      .returning({ id: screenSeatLayouts.id })
      .get()
    if (!layout) throw new Error('Failed to create integration seat layout')
    seatLayoutId = layout.id

    const insertedSeats = await db
      .insert(seats)
      .values([
        {
          screenId,
          seatLayoutId,
          rowLabel: 'A',
          colNo: 1,
          positionTopPct: 10,
          positionLeftPct: 20,
          seatWidthPct: 5,
          seatHeightPct: 5,
          hitRadiusPct: 2,
        },
        {
          screenId,
          seatLayoutId,
          rowLabel: 'A',
          colNo: 2,
          positionTopPct: 10,
          positionLeftPct: 27,
          seatWidthPct: 5,
          seatHeightPct: 5,
          hitRadiusPct: 2,
        },
      ])
      .returning({ id: seats.id })
      .all()
    movieSeatId = insertedSeats[0].id

    const movie = await db
      .insert(screenings)
      .values({
        type: 'movie',
        title: 'Integration Movie',
        description: 'SQLite test fixture',
        durationMin: 120,
        status: 'now_showing',
      })
      .returning({ id: screenings.id })
      .get()
    const stage = await db
      .insert(screenings)
      .values({
        type: 'stage',
        title: 'Integration Stage',
        description: 'SQLite test fixture',
        durationMin: 90,
        status: 'now_showing',
      })
      .returning({ id: screenings.id })
      .get()
    if (!movie || !stage) throw new Error('Failed to create integration screenings')
    movieId = movie.id
    stageId = stage.id

    const { start } = jstDateUtcRange(screeningDate)
    const movieSchedule = await db
      .insert(schedules)
      .values({
        screeningId: movieId,
        screenId,
        startsAt: new Date(start.getTime() + 12 * 60 * 60 * 1000),
        endsAt: new Date(start.getTime() + 14 * 60 * 60 * 1000),
        isPublic: true,
      })
      .returning({ id: schedules.id })
      .get()
    await db.insert(schedules).values({
      screeningId: stageId,
      screenId,
      startsAt: new Date(start.getTime() + 16 * 60 * 60 * 1000),
      endsAt: new Date(start.getTime() + 17 * 60 * 60 * 1000),
      isPublic: true,
    })
    if (!movieSchedule) throw new Error('Failed to create integration movie schedule')
    movieScheduleId = movieSchedule.id

    await ensureProductCatalogSchema()
    await ensurePosSchema()
  })

  afterAll(() => {
    closeDatabase()
  })

  it('returns the health status through the Hono app', async () => {
    const response = await app.request('/api/v1/health')

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ status: 'ok' })
  })

  it('reads movies from the migrated SQLite database', async () => {
    const response = await app.request('/api/movies')
    const body = (await response.json()) as { data?: { items?: unknown[] } }

    expect(response.status).toBe(200)
    expect(Array.isArray(body.data?.items)).toBe(true)
  })

  it('lists catalog products through the Hono API', async () => {
    const response = await app.request('/api/products')
    const body = (await response.json()) as { data?: { items?: Array<{ id: string }> } }

    expect(response.status).toBe(200)
    expect(body.data?.items?.some((product) => product.id === 'salt-popcorn')).toBe(true)
  })

  it('filters movie and stage schedules by the JST calendar day', async () => {
    const movies = await new DrizzleMovieRepository().findMovies({ date: screeningDate })
    const movieSchedules = await new DrizzleMovieRepository().findSchedulesByMovieId(
      movieId,
      screeningDate,
    )
    const stages = await new DrizzleStageRepository().findAll({ date: screeningDate })

    expect(movies.some((movie) => movie.id === movieId)).toBe(true)
    expect(movieSchedules.some((schedule) => schedule.scheduleId === movieScheduleId)).toBe(true)
    expect(movieSchedules[0]?.startsAt).toBeInstanceOf(Date)
    expect(stages.some((stage) => stage.id === stageId)).toBe(true)
  })

  it('creates members and persists OTP timestamps as Dates', async () => {
    const members = new DrizzleMemberRepository()
    const member = await members.create('sqlite-integration@example.test', 'SQLite Test')
    expect(await members.findById(member.id)).toEqual(member)
    expect(await members.findByEmail(member.email)).toEqual(member)

    const tokens = new DrizzleOtpTokenRepository()
    const expiresAt = new Date(Date.now() + 60_000)
    await tokens.create(member.id, 'integration-hash', 'login', expiresAt)
    const latest = await tokens.findLatest(member.id, 'login')
    const recent = await tokens.findRecent(member.id, 'login', 60)

    expect(latest?.expiresAt).toBeInstanceOf(Date)
    expect(latest?.expiresAt instanceof Date ? latest.expiresAt.getTime() : null).toBe(
      expiresAt.getTime(),
    )
    expect(recent?.id).toBe(latest?.id)
    await tokens.markUsed(latest!.id)
    expect((await tokens.findLatest(member.id, 'login'))?.usedAt).toBeInstanceOf(Date)

    const expiredMember = await members.create('expired-otp@example.test', 'Expired OTP')
    await tokens.create(expiredMember.id, 'expired-hash', 'login', new Date(Date.now() - 1000))
    const auth = new AuthService(
      members,
      tokens,
      { sendOtp: async () => {} },
      { generate: () => '000000', hash: () => 'expired-hash' },
      { check: () => true },
      { expiresMin: 5, resendSec: 60, maxAttempts: 5, lockMin: 10 },
    )
    await expect(
      auth.verifyOtp({ email: expiredMember.email, type: 'login', code: '000000' }, '127.0.0.1'),
    ).rejects.toMatchObject({ code: 'OTP_EXPIRED' })
  })

  it('serializes seat holds, confirms reservations, and releases cancelled seats', async () => {
    const reservations = new DrizzleReservationRepository()
    const expiresAt = new Date(Date.now() + 5 * 60_000)

    await reservations.hold(movieScheduleId, [movieSeatId], expiresAt, 'SQLITE-HOLD-1')
    const [heldSeat] = await reservations.findSeats(movieScheduleId, screenId)
    expect(heldSeat.status).toBe('held')
    await expect(
      reservations.hold(movieScheduleId, [movieSeatId], expiresAt, 'SQLITE-HOLD-2'),
    ).rejects.toThrow('already reserved or held')

    const confirmed = await reservations.finalize({
      reservationCode: 'SQLITE-HOLD-1',
      scheduleId: movieScheduleId,
      memberId: null,
      bookingType: 'guest',
      customerEmail: 'guest@example.test',
      tickets: [{ seatId: movieSeatId, ticketType: 'general' }],
      totalPrice: 1800,
      generatedCode: 'SQLITE-RESERVATION-1',
    })
    expect(confirmed.reservationCode).toBe('SQLITE-HOLD-1')
    expect((await reservations.findDetail(confirmed.reservationCode))?.status).toBe('confirmed')

    const cancelTarget = await reservations.findForCancel(confirmed.reservationCode)
    expect(cancelTarget?.id).toBe(confirmed.reservationId)
    await reservations.cancel(confirmed.reservationId)
    const [releasedSeat] = await reservations.findSeats(movieScheduleId, screenId)
    expect(releasedSeat.status).toBe('available')
  })

  it('seeds POS products, records a sale, and preserves inventory on reseed', async () => {
    const pos = new DrizzlePosRepository()
    const product = (await pos.findProducts()).find(
      (candidate) => candidate.slug === 'salt-popcorn',
    )
    expect(product?.stockQuantity).toBe(120)
    expect(product).toBeDefined()

    await db
      .update(posProducts)
      .set({ updatedAt: new Date(0) })
      .where(eq(posProducts.id, product!.id))

    await pos.createSale({
      paymentMethod: 'cash',
      items: [{ productId: product!.id, quantity: 2 }],
    })
    expect(
      (await pos.findProducts()).find((candidate) => candidate.id === product!.id)?.stockQuantity,
    ).toBe(118)
    const [timestamps] = await db
      .select({ createdAt: posProducts.createdAt, updatedAt: posProducts.updatedAt })
      .from(posProducts)
      .where(eq(posProducts.id, product!.id))
    expect(timestamps.createdAt).toBeInstanceOf(Date)
    expect(timestamps.updatedAt).toBeInstanceOf(Date)
    expect(timestamps.updatedAt.getTime()).toBeGreaterThan(0)

    await ensurePosSchema()
    expect(
      (await pos.findProducts()).find((candidate) => candidate.id === product!.id)?.stockQuantity,
    ).toBe(118)
  })
})
