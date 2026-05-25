import type { ReservationFlowState, FlowStep, GuardResult } from "./types"

export function canProceed(state: ReservationFlowState, to: FlowStep): GuardResult {
  const hasSeats = !!state.scheduleId && (state.selectedSeats?.length ?? 0) > 0

  switch (to) {
    case "entry":
    case "customer":
      if (!hasSeats) return fail("/movies", "座席情報が不足しています。上映回選択からやり直してください。")
      return ok()

    case "tickets":
      if (!hasSeats) return fail("/movies", "座席情報が不足しています。上映回選択からやり直してください。")
      if (!state.bookingType) return fail("/reservations/entry", "予約方法を選択してください。")
      return ok()

    case "payment": {
      const ticketsCheck = canProceed(state, "tickets")
      if (!ticketsCheck.ok) return ticketsCheck
      if (!state.customer?.email) return fail("/reservations/customer", "お客様情報が不足しています。")
      if (!state.reservationCode || !state.layoutVersion) return fail("/movies", "座席の仮押さえ情報が不足しています。")
      return ok()
    }

    case "confirm": {
      const paymentCheck = canProceed(state, "payment")
      if (!paymentCheck.ok) return paymentCheck
      if (!state.paymentCard) return fail("/reservations/payment", "お支払い情報が不足しています。")
      return ok()
    }
  }
}

function ok(): GuardResult { return { ok: true } }
function fail(redirectTo: string, message: string): GuardResult { return { ok: false, redirectTo, message } }
