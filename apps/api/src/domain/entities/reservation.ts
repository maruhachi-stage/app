export type TicketType = 'general' | 'university' | 'highschool' | 'child'
export type BookingType = 'member' | 'guest'
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled'
export type SeatStatus = 'available' | 'reserved' | 'held'

export type Reservation = {
  id: number
  reservationCode: string
  status: ReservationStatus
  memberId: number | null
  bookingType: BookingType
  customerEmail: string
  startsAt: Date | string
}
export type SeatPosition = {
  seatId: number
  row: string
  col: number
  topPct: number
  leftPct: number
  widthPct: number
  heightPct: number
  hitRadiusPct: number | null
  status: SeatStatus
}
export type SeatLayout = {
  id: number
  version: number
  backgroundImageUrl: string | null
  aspectRatioWidth: number
  aspectRatioHeight: number
}
