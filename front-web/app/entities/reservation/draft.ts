import type { TicketType, TicketCounts } from "~/entities/ticket"

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
  bookingType?: "member" | "guest"
  customer?: { email: string }
}

const KEY = "hal_cinema_reservation_draft"

export const draft = {
  get(): ReservationDraft {
    if (typeof window === "undefined") return {}
    try {
      const raw = sessionStorage.getItem(KEY)
      return raw ? (JSON.parse(raw) as ReservationDraft) : {}
    } catch {
      return {}
    }
  },

  set(partial: Partial<ReservationDraft>): void {
    if (typeof window === "undefined") return
    const current = draft.get()
    sessionStorage.setItem(KEY, JSON.stringify({ ...current, ...partial }))
  },

  clear(): void {
    if (typeof window === "undefined") return
    sessionStorage.removeItem(KEY)
  },
}
