import type { Context } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '#types.js'
import { AppError } from '#lib/errors.js'
import { successResponse } from '#utils/response.js'
import { sendReservationEmail } from '#lib/email.js'
import { checkRateLimit } from '#utils/rateLimit.js'
import { getQrCodeUrl, toJstString } from '#utils/format.js'
import { TICKET_LABELS, TICKET_PRICES } from '#config/constants.js'
import { getFullScheduleById } from '#modules/movies/service.js'
import * as ReservationService from '#modules/reservations/service.js'

const RESERVATION_CODE_RE = /^[A-Z0-9]{8,12}$/

export const quote = async (c: Context<AppEnv>) => {
  const requestId = c.get('requestId')
  const body = await c.req.json().catch(() => { throw new AppError('VALIDATION_ERROR', 'Invalid JSON') })

  const { ticketCounts } = z.object({
    scheduleId: z.number().int().positive(),
    ticketCounts: z.object({
      general: z.number().int().min(0),
      university: z.number().int().min(0),
      highschool: z.number().int().min(0),
      child: z.number().int().min(0),
    }),
  }).parse(body)

  const ticketCount = Object.values(ticketCounts).reduce((a, b) => a + b, 0)
  const totalPrice =
    ticketCounts.general * TICKET_PRICES.general +
    ticketCounts.university * TICKET_PRICES.university +
    ticketCounts.highschool * TICKET_PRICES.highschool +
    ticketCounts.child * TICKET_PRICES.child

  return c.json(successResponse({ ticketCount, totalPrice }, requestId))
}

export const getSeats = async (c: Context<AppEnv>) => {
  const requestId = c.get('requestId')
  const scheduleId = Number(c.req.param('scheduleId'))

  if (!Number.isInteger(scheduleId) || scheduleId <= 0) {
    throw new AppError('VALIDATION_ERROR', 'Invalid scheduleId')
  }

  const result = await ReservationService.getSeatsForSchedule(scheduleId)
  return c.json(successResponse({ scheduleId, ...result }, requestId))
}

export const holdSeats = async (c: Context<AppEnv>) => {
  const requestId = c.get('requestId')
  const session = c.get('session')
  const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown'

  const rlKey = session ? `hold:member:${session.memberId}` : `hold:ip:${ip}`
  if (!checkRateLimit(rlKey, 10, 60 * 1000)) {
    throw new AppError('RESERVATION_LIMIT_EXCEEDED', 'Too many seat hold attempts')
  }

  const body = await c.req.json().catch(() => { throw new AppError('VALIDATION_ERROR', 'Invalid JSON') })

  const { scheduleId, seatIds } = z.object({
    scheduleId: z.number().int().positive(),
    seatIds: z.array(z.number().int().positive()).min(1).max(8),
  }).parse(body)

  if (new Set(seatIds).size !== seatIds.length) {
    throw new AppError('VALIDATION_ERROR', 'Duplicate seat IDs')
  }

  const { reservationCode, expiresAt } = await ReservationService.holdSeats(scheduleId, seatIds)
  return c.json(successResponse({ reservationCode, expiresAt: expiresAt.toISOString() }, requestId), 201)
}

export const createReservation = async (c: Context<AppEnv>) => {
  const requestId = c.get('requestId')
  const session = c.get('session')
  const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown'

  const rlKey = session ? `res:member:${session.memberId}` : `res:ip:${ip}`
  if (!checkRateLimit(rlKey, 20, 5 * 60 * 1000)) {
    throw new AppError('RESERVATION_LIMIT_EXCEEDED', 'Too many reservation attempts')
  }

  const body = await c.req.json().catch(() => { throw new AppError('VALIDATION_ERROR', 'Invalid JSON') })
  const data = z.object({
    reservationCode: z.string().optional(),
    scheduleId: z.number().int().positive(),
    layoutVersion: z.number().int().positive(),
    seatIds: z.array(z.number().int().positive()).min(1).max(8),
    bookingType: z.enum(['member', 'guest']),
    tickets: z.array(z.object({
      seatId: z.number().int().positive(),
      ticketType: z.enum(['general', 'university', 'highschool', 'child']),
    })).min(1).max(8),
    customer: z.object({
      email: z.string().email().max(254),
    }),
  }).parse(body)

  if (new Set(data.seatIds).size !== data.seatIds.length) {
    throw new AppError('VALIDATION_ERROR', 'Duplicate seat IDs')
  }

  const ticketSeatIds = data.tickets.map(t => t.seatId)
  if (new Set(ticketSeatIds).size !== ticketSeatIds.length) {
    throw new AppError('VALIDATION_ERROR', 'Duplicate ticket seat IDs')
  }

  if (data.seatIds.length !== data.tickets.length || !data.tickets.every(t => data.seatIds.includes(t.seatId))) {
    throw new AppError('VALIDATION_ERROR', 'seatIds and tickets.seatId must match exactly')
  }

  let memberId: number | null = null
  if (data.bookingType === 'member') {
    if (!session) throw new AppError('UNAUTHORIZED', 'Authentication required for member booking')
    memberId = session.memberId
  }

  const sched = await getFullScheduleById(data.scheduleId)
  if (!sched) throw new AppError('NOT_FOUND', 'Schedule not found')

  await ReservationService.checkLayoutVersion(sched.screen_id, data.layoutVersion)
  const seatInfoMap = await ReservationService.getSeatsInScreen(data.seatIds, sched.screen_id)

  const { reservationId, reservationCode, totalPrice } = await ReservationService.finalizeReservation({
    reservationCode: data.reservationCode,
    scheduleId: data.scheduleId,
    memberId,
    bookingType: data.bookingType,
    customer: data.customer,
    tickets: data.tickets,
  })

  const qrCodeUrl = getQrCodeUrl(reservationCode)
  const seatList = data.tickets.map(t => {
    const info = seatInfoMap.get(t.seatId)
    return `  ${info?.row_label ?? '?'}-${info?.col_no ?? '?'}  ${TICKET_LABELS[t.ticketType]}  ${TICKET_PRICES[t.ticketType].toLocaleString()}円`
  }).join('\n')

  sendReservationEmail({
    to: data.customer.email,
    reservationCode,
    movieTitle: sched.movie_title as string,
    startsAtJst: toJstString(new Date(sched.starts_at as string)),
    endsAtJst: toJstString(new Date(sched.ends_at as string)),
    screenName: sched.screen_name as string,
    seatList,
    totalPrice,
    qrCodeUrl,
    reservationDetailUrl: `${process.env.BASE_URL ?? 'http://localhost:5173'}/reservations/r/${reservationCode}`,
  }).catch(err => console.error('[EMAIL]', err))

  return c.json(successResponse({ reservationId, reservationCode, totalPrice, qrCodeUrl }, requestId), 201)
}

export const getReservation = async (c: Context<AppEnv>) => {
  const requestId = c.get('requestId')
  const code = c.req.param('reservationCode')!.toUpperCase()

  if (!RESERVATION_CODE_RE.test(code)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid reservation code format')
  }

  const reservation = await ReservationService.getReservationDetail(code)
  if (!reservation) throw new AppError('NOT_FOUND', 'Reservation not found')

  return c.json(successResponse(reservation, requestId))
}

export const cancelReservation = async (c: Context<AppEnv>) => {
  const requestId = c.get('requestId')
  const session = c.get('session')
  const code = c.req.param('reservationCode')!.toUpperCase()

  if (!RESERVATION_CODE_RE.test(code)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid reservation code format')
  }

  const reservation = await ReservationService.getReservationForCancel(code)
  if (!reservation) throw new AppError('NOT_FOUND', 'Reservation not found')

  if (reservation.status === 'cancelled') throw new AppError('ALREADY_CANCELLED', 'Already cancelled')

  if ((new Date(reservation.startsAt as string).getTime() - Date.now()) <= 30 * 60 * 1000) {
    throw new AppError('CANCELLATION_NOT_ALLOWED', 'Cancellation not allowed within 30 minutes of showtime')
  }

  if (reservation.bookingType === 'member') {
    if (!session || session.memberId !== reservation.memberId) {
      throw new AppError('FORBIDDEN', 'Not authorized to cancel this reservation')
    }
  } else {
    const body = await c.req.json().catch(() => ({ email: '' }))
    const { email } = z.object({ email: z.string().email() }).parse(body)
    if (email.toLowerCase() !== reservation.customerEmail.toLowerCase()) {
      throw new AppError('FORBIDDEN', 'Email does not match reservation')
    }
  }

  await ReservationService.cancelReservation(reservation.id)
  return c.json(successResponse({ reservationCode: code, status: 'cancelled' }, requestId))
}
