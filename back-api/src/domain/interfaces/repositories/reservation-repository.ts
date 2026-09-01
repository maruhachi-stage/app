import type {
  BookingType,
  Reservation,
  SeatLayout,
  SeatPosition,
  TicketType,
} from '#domain/entities/reservation.js'

export type ReservationDetail = {
  reservationCode: string
  status: string
  bookingType: BookingType
  customerEmail: string
  totalPrice: number
  screeningTitle: string
  screeningType: 'movie' | 'stage' | 'event'
  thumbnailUrl: string | null
  startsAt: Date | string
  endsAt: Date | string
  screenName: string
  seats: { row: string; col: number; ticketType: string; price: number }[]
}
export type PublicSchedule = {
  screenId: number
  title: string
  startsAt: Date | string
  endsAt: Date | string
  screenName: string
}
export interface ReservationRepository {
  findPublicSchedule(scheduleId: number): Promise<PublicSchedule | null>
  findLayout(screenId: number): Promise<SeatLayout | null>
  findSeats(scheduleId: number, screenId: number): Promise<SeatPosition[]>
  findSeatsInScreen(
    seatIds: number[],
    screenId: number,
  ): Promise<Map<number, { row: string; col: number }>>
  findDetail(code: string): Promise<ReservationDetail | null>
  findForCancel(code: string): Promise<Reservation | null>
  cancel(id: number): Promise<void>
  hold(scheduleId: number, seatIds: number[], expiresAt: Date, code: string): Promise<void>
  finalize(input: {
    reservationCode?: string
    scheduleId: number
    memberId: number | null
    bookingType: BookingType
    customerEmail: string
    tickets: { seatId: number; ticketType: TicketType }[]
    totalPrice: number
    generatedCode: string
  }): Promise<{ reservationId: number; reservationCode: string }>
  reservationCodeExists(code: string): Promise<boolean>
}
