// Domain: 予約ドラフトの型定義
import type { TicketType, TicketCounts } from '~/features/reservation/domain/ticket'

export type SelectedSeat = {
    seatId: number
    row: string
    col: number
    ticketType: TicketType
}

export type ReservationDraft = {
    scheduleId?: number
    reservationCode?: string
    expiresAt?: string
    ticketCounts?: TicketCounts
    selectedSeats?: SelectedSeat[]
    layoutVersion?: number
    bookingType?: 'member' | 'guest'
    customer?: { email: string }
}
