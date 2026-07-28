import type { SelectedSeat } from "~/features/reservation/domain/draft"
import type { TicketCounts } from "~/features/reservation/domain/ticket"

export type FlowStep = "entry" | "customer" | "tickets" | "confirm" | "payment"

export type ReservationFlowState = {
  scheduleId?: number
  selectedSeats?: SelectedSeat[]
  layoutVersion?: number
  reservationCode?: string
  expiresAt?: string
  bookingType?: "member" | "guest"
  customer?: { email: string }
  ticketCounts?: TicketCounts
  totalPrice?: number
  paymentCard?: { cardNo: string; expiry: string; cvv: string }
}

export type GuardResult =
  | { ok: true }
  | { ok: false; redirectTo: string; message: string }
