import type { Context } from 'hono'
import { z } from 'zod'
import {
  quoteRequestSchema,
  holdRequestSchema,
  createReservationRequestSchema,
} from '#application/dto/reservation-dto.js'
import type { ReservationService } from '#application/services/reservation-service.js'
import { ReservationError } from '#domain/errors/reservation-error.js'
import { AppError } from '#lib/errors.js'
import { getQrCodeUrl, imageUrl, maskEmail, toJstString } from '#lib/format.js'
import { TICKET_LABELS, TICKET_PRICES } from '#lib/constants.js'
import { successResponse } from '#presentation/response.js'
import type { AppEnv } from '#types.js'

const codeRe = /^[A-Z0-9]{8,12}$/
export class ReservationController {
  constructor(
    private readonly service: ReservationService,
    private readonly rateLimit: (key: string, max: number, windowMs: number) => boolean,
  ) {}
  quote = async (c: Context<AppEnv>) => {
    const body = await c.req.json().catch(() => {
      throw new AppError('VALIDATION_ERROR', 'Invalid JSON')
    })
    return c.json(
      successResponse(
        this.service.quote(quoteRequestSchema.parse(body).ticketCounts),
        c.get('requestId'),
      ),
    )
  }
  seats = async (c: Context<AppEnv>) => {
    const id = Number(c.req.param('scheduleId'))
    if (!Number.isInteger(id) || id <= 0)
      throw new AppError('VALIDATION_ERROR', 'Invalid scheduleId')
    return c.json(
      successResponse(await this.call(() => this.service.seatMap(id)), c.get('requestId')),
    )
  }
  hold = async (c: Context<AppEnv>) => {
    const session = c.get('session'),
      ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown'
    if (!this.rateLimit(session ? `hold:member:${session.memberId}` : `hold:ip:${ip}`, 10, 60000))
      throw new AppError('RESERVATION_LIMIT_EXCEEDED', 'Too many seat hold attempts')
    const body = await c.req.json().catch(() => {
      throw new AppError('VALIDATION_ERROR', 'Invalid JSON')
    })
    const input = holdRequestSchema.parse(body)
    const result = await this.call(() => this.service.hold(input.scheduleId, input.seatIds))
    return c.json(
      successResponse(
        { reservationCode: result.reservationCode, expiresAt: result.expiresAt.toISOString() },
        c.get('requestId'),
      ),
      201,
    )
  }
  create = async (c: Context<AppEnv>) => {
    const session = c.get('session'),
      ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown'
    if (!this.rateLimit(session ? `res:member:${session.memberId}` : `res:ip:${ip}`, 20, 300000))
      throw new AppError('RESERVATION_LIMIT_EXCEEDED', 'Too many reservation attempts')
    const body = await c.req.json().catch(() => {
      throw new AppError('VALIDATION_ERROR', 'Invalid JSON')
    })
    const input = createReservationRequestSchema.parse(body)
    const result = await this.call(() => this.service.create(input, session?.memberId ?? null))
    const qrCodeUrl = getQrCodeUrl(result.reservationCode)
    const seatList = input.tickets
      .map((ticket) => {
        const seat = result.seats.get(ticket.seatId)
        return `  ${seat?.row ?? '?'}-${seat?.col ?? '?'}  ${TICKET_LABELS[ticket.ticketType]}  ${TICKET_PRICES[ticket.ticketType].toLocaleString()}`
      })
      .join('\n')
    c.get('container')
      .emailSender.sendReservation({
        to: input.customer.email,
        reservationCode: result.reservationCode,
        movieTitle: result.schedule.title,
        startsAtJst: toJstString(new Date(result.schedule.startsAt)),
        endsAtJst: toJstString(new Date(result.schedule.endsAt)),
        screenName: result.schedule.screenName,
        seatList,
        totalPrice: result.totalPrice,
        qrCodeUrl,
        reservationDetailUrl: `${this.siteOrigin(c)}/reservations/r/${result.reservationCode}`,
      })
      .catch((err) => console.error('[EMAIL]', err))
    return c.json(
      successResponse(
        {
          reservationId: result.reservationId,
          reservationCode: result.reservationCode,
          totalPrice: result.totalPrice,
          qrCodeUrl,
        },
        c.get('requestId'),
      ),
      201,
    )
  }
  get = async (c: Context<AppEnv>) => {
    const code = this.code(c)
    const r = await this.call(() => this.service.detail(code))
    return c.json(
      successResponse(
        {
          reservationCode: r.reservationCode,
          status: r.status,
          bookingType: r.bookingType,
          canCancel: r.canCancel,
          movie: {
            title: r.screeningTitle,
            thumbnailUrl: imageUrl(r.thumbnailUrl),
            type: r.screeningType,
          },
          schedule: { startsAt: r.startsAt, endsAt: r.endsAt, screenName: r.screenName },
          seats: r.seats,
          totalPrice: r.totalPrice,
          customer: { maskedEmail: maskEmail(r.customerEmail) },
          qrCodeUrl: r.status === 'confirmed' ? getQrCodeUrl(r.reservationCode) : null,
        },
        c.get('requestId'),
      ),
    )
  }
  cancel = async (c: Context<AppEnv>) => {
    const code = this.code(c)
    let email: string | undefined
    if (!c.get('session')) {
      const body = await c.req.json().catch(() => ({ email: '' }))
      email = z.object({ email: z.string().email() }).parse(body).email
    }
    const r = await this.call(() =>
      this.service.cancel(code, c.get('session')?.memberId ?? null, email),
    )
    return c.json(successResponse(r, c.get('requestId')))
  }
  /**
   * Origin of the browser that sent the request. The Pages function forwards
   * the original host and browsers send `Origin` on POST, so the emailed link
   * follows the current deployment without a BASE_URL setting.
   */
  private siteOrigin(c: Context<AppEnv>): string {
    const origin = c.req.header('origin')
    if (origin) return origin.replace(/\/+$/, '')
    const host = c.req.header('x-forwarded-host')
    if (host) return `${c.req.header('x-forwarded-proto') ?? 'https'}://${host}`
    return new URL(c.req.url).origin
  }
  private code(c: Context<AppEnv>) {
    const value = c.req.param('reservationCode')!.toUpperCase()
    if (!codeRe.test(value))
      throw new AppError('VALIDATION_ERROR', 'Invalid reservation code format')
    return value
  }
  private async call<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn()
    } catch (error) {
      if (error instanceof ReservationError) throw new AppError(error.code, error.message)
      throw error
    }
  }
}
