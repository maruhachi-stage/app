import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { ReservationFlowState, FlowStep, GuardResult } from "./types"
import type { SelectedSeat } from "~/entities/reservation/draft"
import type { TicketCounts } from "~/entities/ticket"
import { canProceed } from "./guards"

const STORAGE_KEY = "hal_cinema_reservation_draft"
const COMPLETE_KEY = "hal_cinema_last_reservation"

function loadState(): ReservationFlowState {
  if (typeof window === "undefined") return {}
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ReservationFlowState) : {}
  } catch { return {} }
}

function saveState(state: ReservationFlowState): void {
  if (typeof window === "undefined") return
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

type ContextValue = {
  state: ReservationFlowState
  setSeatsAndHold: (data: {
    scheduleId: number
    reservationCode: string
    expiresAt: string
    selectedSeats: SelectedSeat[]
    layoutVersion: number
  }) => void
  setBookingType: (type: "member" | "guest") => void
  setCustomer: (customer: { email: string }) => void
  setTickets: (seats: SelectedSeat[], counts: TicketCounts, totalPrice: number) => void
  setPaymentCard: (card: { cardNo: string; expiry: string; cvv: string }) => void
  completeFlow: (result: {
    reservationId: number
    reservationCode: string
    totalPrice: number
    qrCodeUrl: string
  }) => void
  clearFlow: () => void
  canProceedTo: (step: FlowStep) => GuardResult
}

const ReservationFlowContext = createContext<ContextValue | null>(null)

export function ReservationFlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ReservationFlowState>(loadState)

  const update = useCallback((partial: Partial<ReservationFlowState>) => {
    setState(prev => {
      const next = { ...prev, ...partial }
      saveState(next)
      return next
    })
  }, [])

  const setSeatsAndHold = useCallback(
    (data: Parameters<ContextValue["setSeatsAndHold"]>[0]) => {
      update({
        scheduleId: data.scheduleId,
        reservationCode: data.reservationCode,
        expiresAt: data.expiresAt,
        selectedSeats: data.selectedSeats,
        layoutVersion: data.layoutVersion,
      })
    },
    [update],
  )

  const setBookingType = useCallback(
    (type: "member" | "guest") => update({ bookingType: type }),
    [update],
  )

  const setCustomer = useCallback(
    (customer: { email: string }) => update({ customer }),
    [update],
  )

  const setTickets = useCallback(
    (seats: SelectedSeat[], counts: TicketCounts, totalPrice: number) => update({ selectedSeats: seats, ticketCounts: counts, totalPrice }),
    [update],
  )

  const setPaymentCard = useCallback(
    (card: { cardNo: string; expiry: string; cvv: string }) => update({ paymentCard: card }),
    [update],
  )

  const completeFlow = useCallback(
    (result: Parameters<ContextValue["completeFlow"]>[0]) => {
      sessionStorage.setItem(COMPLETE_KEY, JSON.stringify(result))
      sessionStorage.removeItem(STORAGE_KEY)
      setState({})
    },
    [],
  )

  const clearFlow = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY)
    setState({})
  }, [])

  const canProceedTo = useCallback((step: FlowStep) => canProceed(state, step), [state])

  return (
    <ReservationFlowContext.Provider
      value={{ state, setSeatsAndHold, setBookingType, setCustomer, setTickets, setPaymentCard, completeFlow, clearFlow, canProceedTo }}
    >
      {children}
    </ReservationFlowContext.Provider>
  )
}

export function useReservationFlow(): ContextValue {
  const ctx = useContext(ReservationFlowContext)
  if (!ctx) throw new Error("useReservationFlow must be used within ReservationFlowProvider")
  return ctx
}
