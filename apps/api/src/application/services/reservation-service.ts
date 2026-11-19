import { RESERVATION_CONFIG, TICKET_PRICES } from '#lib/constants.js'
import { ReservationError } from '#domain/errors/reservation-error.js'
import type { ReservationRepository } from '#domain/interfaces/repositories/reservation-repository.js'
import type { CreateReservationRequestDTO } from '#application/dto/reservation-dto.js'

const code = () => Math.random().toString(36).slice(2, 12).toUpperCase()
const ensureUnique = (ids: number[], message: string) => {
  if (new Set(ids).size !== ids.length) throw new ReservationError('VALIDATION_ERROR', message)
}
export class ReservationService {
  constructor(
    private readonly repository: ReservationRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}
  quote(ticketCounts: Record<'general' | 'university' | 'highschool' | 'child', number>) {
    const ticketCount = Object.values(ticketCounts).reduce((a, b) => a + b, 0)
    return {
      ticketCount,
      totalPrice: Object.entries(ticketCounts).reduce(
        (sum, [key, count]) => sum + TICKET_PRICES[key as keyof typeof TICKET_PRICES] * count,
        0,
      ),
    }
  }
  async seatMap(scheduleId: number) {
    const schedule = await this.repository.findPublicSchedule(scheduleId)
    if (!schedule) throw new ReservationError('NOT_FOUND', 'Schedule not found')
    const layout = await this.repository.findLayout(schedule.screenId)
    if (!layout) throw new ReservationError('NOT_FOUND', 'Seat layout not found')
    return {
      scheduleId,
      layout: {
        screenId: schedule.screenId,
        layoutId: layout.id,
        layoutVersion: layout.version,
        backgroundImageUrl: layout.backgroundImageUrl,
        aspectRatio: `${layout.aspectRatioWidth}/${layout.aspectRatioHeight}`,
        designWidth: layout.aspectRatioWidth,
        designHeight: layout.aspectRatioHeight,
      },
      objects: defaultObjects(),
      sections: [],
      seats: (await this.repository.findSeats(scheduleId, schedule.screenId)).map(presentSeat),
    }
  }
  async hold(scheduleId: number, seatIds: number[]) {
    ensureUnique(seatIds, 'Duplicate seat IDs')
    const schedule = await this.repository.findPublicSchedule(scheduleId)
    if (!schedule) throw new ReservationError('NOT_FOUND', 'Schedule not found')
    const seats = await this.repository.findSeatsInScreen(seatIds, schedule.screenId)
    if (seats.size !== seatIds.length)
      throw new ReservationError('VALIDATION_ERROR', 'One or more invalid seat IDs')
    let reservationCode = ''
    for (let i = 0; i < 5; i++) {
      const candidate = code()
      if (!(await this.repository.reservationCodeExists(candidate))) {
        reservationCode = candidate
        break
      }
    }
    if (!reservationCode)
      throw new ReservationError('INTERNAL_SERVER_ERROR', 'Failed to generate reservation code')
    const expiresAt = new Date(this.now().getTime() + RESERVATION_CONFIG.HOLD_EXPIRES_MIN * 60000)
    await this.repository.hold(scheduleId, seatIds, expiresAt, reservationCode)
    return { reservationCode, expiresAt }
  }
  async create(input: CreateReservationRequestDTO, memberId: number | null) {
    ensureUnique(input.seatIds, 'Duplicate seat IDs')
    const ticketIds = input.tickets.map((t) => t.seatId)
    ensureUnique(ticketIds, 'Duplicate ticket seat IDs')
    if (
      input.seatIds.length !== ticketIds.length ||
      !ticketIds.every((id) => input.seatIds.includes(id))
    )
      throw new ReservationError(
        'VALIDATION_ERROR',
        'seatIds and tickets.seatId must match exactly',
      )
    if (input.bookingType === 'member' && memberId === null)
      throw new ReservationError('UNAUTHORIZED', 'Authentication required for member booking')
    const schedule = await this.repository.findPublicSchedule(input.scheduleId)
    if (!schedule) throw new ReservationError('NOT_FOUND', 'Schedule not found')
    const layout = await this.repository.findLayout(schedule.screenId)
    if (!layout || layout.version !== input.layoutVersion)
      throw new ReservationError('SEAT_LAYOUT_VERSION_MISMATCH', 'Seat layout has been updated')
    const seats = await this.repository.findSeatsInScreen(input.seatIds, schedule.screenId)
    if (seats.size !== input.seatIds.length)
      throw new ReservationError('VALIDATION_ERROR', 'One or more invalid seat IDs')
    let generatedCode = ''
    if (!input.reservationCode) {
      for (let i = 0; i < 5; i++) {
        const candidate = code()
        if (!(await this.repository.reservationCodeExists(candidate))) {
          generatedCode = candidate
          break
        }
      }
      if (!generatedCode)
        throw new ReservationError('INTERNAL_SERVER_ERROR', 'Failed to generate reservation code')
    }
    const totalPrice = input.tickets.reduce((sum, t) => sum + TICKET_PRICES[t.ticketType], 0)
    const result = await this.repository.finalize({
      reservationCode: input.reservationCode,
      scheduleId: input.scheduleId,
      memberId,
      bookingType: input.bookingType,
      customerEmail: input.customer.email,
      tickets: input.tickets,
      totalPrice,
      generatedCode,
    })
    return { ...result, totalPrice, schedule, seats }
  }
  async detail(code: string) {
    const detail = await this.repository.findDetail(code)
    if (!detail) throw new ReservationError('NOT_FOUND', 'Reservation not found')
    const canCancel =
      detail.status === 'confirmed' &&
      new Date(detail.startsAt).getTime() - this.now().getTime() > 1800000
    return { ...detail, canCancel }
  }
  async cancel(code: string, sessionMemberId: number | null, email?: string) {
    const reservation = await this.repository.findForCancel(code)
    if (!reservation) throw new ReservationError('NOT_FOUND', 'Reservation not found')
    if (reservation.status === 'cancelled')
      throw new ReservationError('ALREADY_CANCELLED', 'Already cancelled')
    if (new Date(reservation.startsAt).getTime() - this.now().getTime() <= 1800000)
      throw new ReservationError(
        'CANCELLATION_NOT_ALLOWED',
        'Cancellation not allowed within 30 minutes of showtime',
      )
    if (reservation.bookingType === 'member' && sessionMemberId !== reservation.memberId)
      throw new ReservationError('FORBIDDEN', 'Not authorized to cancel this reservation')
    if (
      reservation.bookingType === 'guest' &&
      email?.toLowerCase() !== reservation.customerEmail.toLowerCase()
    )
      throw new ReservationError('FORBIDDEN', 'Email does not match reservation')
    await this.repository.cancel(reservation.id)
    return { reservationCode: code, status: 'cancelled' as const }
  }
}
const presentSeat = (s: {
  seatId: number
  row: string
  col: number
  topPct: number
  leftPct: number
  widthPct: number
  heightPct: number
  hitRadiusPct: number | null
  status: string
}) => {
  const size =
    s.widthPct <= 0 && s.heightPct <= 0
      ? 3
      : s.widthPct <= 0
        ? s.heightPct
        : s.heightPct <= 0
          ? s.widthPct
          : Math.min(s.widthPct, s.heightPct)
  return {
    seatId: s.seatId,
    seatCode: `${s.row}-${s.col}`,
    row: s.row,
    col: s.col,
    seatNo: s.col,
    displayLabel: null,
    sectionCode: null,
    seatType: 'standard',
    leftPct: s.leftPct,
    topPct: s.topPct,
    widthPct: size,
    heightPct: size,
    rotationDeg: 0,
    positionTopPct: s.topPct,
    positionLeftPct: s.leftPct,
    seatWidthPct: size,
    seatHeightPct: size,
    hitRadiusPct: s.hitRadiusPct,
    status: s.status,
  }
}
const defaultObjects = () => [
  {
    id: 0,
    type: 'screen',
    code: 'main-screen',
    label: 'SCREEN',
    leftPct: 12,
    topPct: 4,
    widthPct: 76,
    heightPct: 4,
    rotationDeg: 0,
    zIndex: 1,
    style: {},
  },
  {
    id: 0,
    type: 'entrance',
    code: 'main-entrance',
    label: 'ENTRANCE',
    leftPct: 36,
    topPct: 91,
    widthPct: 28,
    heightPct: 5,
    rotationDeg: 0,
    zIndex: 1,
    style: {},
  },
]
