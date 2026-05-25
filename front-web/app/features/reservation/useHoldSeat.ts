import { apiFetch, ApiError } from "~/shared/api/client"
import type { SelectedSeat } from "~/entities/reservation/draft"
import { useReservationFlow } from "~/processes/reservation-flow/context"
import type { SeatMapData } from "~/features/reservation/useSeatMap"

type Props = {
  selectedScheduleId: number | null
  mapData: SeatMapData | null
  selectedSeatIds: number[]
  showToast: (msg: string) => void
}

export function useHoldSeat({ selectedScheduleId, mapData, selectedSeatIds, showToast }: Props) {
  const { setSeatsAndHold } = useReservationFlow()

  async function holdSeats(): Promise<boolean> {
    if (!selectedScheduleId || !mapData || selectedSeatIds.length === 0) return false

    try {
      const result = await apiFetch<{ reservationCode: string; expiresAt: string }>(
        "/reservations/hold",
        {
          method: "POST",
          body: JSON.stringify({ scheduleId: selectedScheduleId, seatIds: selectedSeatIds }),
        },
      )

      const seats = mapData.seats.filter(s => selectedSeatIds.includes(s.seatId))
      const selectedSeats: SelectedSeat[] = seats.map(s => ({
        seatId: s.seatId,
        row: s.row,
        col: s.col,
        ticketType: "general" as const,
      }))

      setSeatsAndHold({
        scheduleId: selectedScheduleId,
        reservationCode: result.reservationCode,
        expiresAt: result.expiresAt,
        selectedSeats,
        layoutVersion: mapData.layout.layoutVersion,
      })
      return true
    } catch (err) {
      if (err instanceof ApiError && err.code === "SEAT_ALREADY_RESERVED") {
        showToast("選択した座席はすでに他の人が予約中または仮押さえ中です。")
      } else {
        showToast("エラーが発生しました。再度お試しください。")
      }
      return false
    }
  }

  return { holdSeats }
}
