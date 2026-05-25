import { useState, useEffect } from "react"
import { apiFetch, ApiError } from "~/shared/api/client"
import { useReservationFlow } from "~/processes/reservation-flow/context"

type ScheduleInfo = {
  scheduleId: number
  movieTitle: string
  screenName: string
  startsAt: string
  endsAt: string
}

export function useConfirm() {
  const { state, completeFlow } = useReservationFlow()
  const [schedInfo, setSchedInfo] = useState<ScheduleInfo | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!state.scheduleId) return
    apiFetch<ScheduleInfo>(`/schedules/${state.scheduleId}`)
      .then(setSchedInfo)
      .catch(() => {})
  }, [state.scheduleId])

  const totalPrice = state.totalPrice ?? 0

  async function submit(): Promise<boolean> {
    if (
      !state.scheduleId || !state.reservationCode || !state.layoutVersion ||
      !state.selectedSeats?.length || !state.customer?.email
    ) {
      setError("予約情報が不足しています。最初からやり直してください。")
      return false
    }

    setError("")
    setSubmitting(true)
    try {
      const result = await apiFetch<{ reservationId: number; reservationCode: string; totalPrice: number; qrCodeUrl: string }>(
        "/reservations",
        {
          method: "POST",
          body: JSON.stringify({
            reservationCode: state.reservationCode,
            scheduleId: state.scheduleId,
            layoutVersion: state.layoutVersion,
            seatIds: state.selectedSeats.map(s => s.seatId),
            bookingType: state.bookingType ?? "guest",
            tickets: state.selectedSeats.map(s => ({ seatId: s.seatId, ticketType: s.ticketType })),
            customer: state.customer,
          }),
        },
      )
      completeFlow(result)
      return true
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "SEAT_ALREADY_RESERVED") setError("選択した座席はすでに予約済みです。座席を選び直してください。")
        else if (err.code === "SEAT_LAYOUT_VERSION_MISMATCH") setError("座席情報が更新されました。座席を選び直してください。")
        else setError(err.message)
      } else {
        setError("エラーが発生しました。再度お試しください。")
      }
      return false
    } finally {
      setSubmitting(false)
    }
  }

  return {
    schedInfo,
    customer: state.customer,
    seats: state.selectedSeats,
    card: state.paymentCard,
    totalPrice,
    submitting,
    error,
    submit,
  }
}
