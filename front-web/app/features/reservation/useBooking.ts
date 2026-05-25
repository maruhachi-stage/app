import { useScheduleSelection } from "~/features/reservation/useScheduleSelection"
import { useSeatMap, type SeatData, type SeatMapData } from "~/features/reservation/useSeatMap"
import { useHoldSeat } from "~/features/reservation/useHoldSeat"

export type { SeatData, SeatMapData }

export function useBooking() {
  const {
    movie, days, selectedDate, setSelectedDate,
    schedules, selectedScheduleId, setSelectedScheduleId,
    loading, error: selectionError, retryLoadSchedules,
  } = useScheduleSelection()

  const {
    mapData, mapLoading, selectedSeatIds, toggleSeat,
    error: mapError, toastMsg, showToast, retryLoadSeatMap,
  } = useSeatMap(selectedScheduleId)

  const { holdSeats } = useHoldSeat({ selectedScheduleId, mapData, selectedSeatIds, showToast })

  const error = selectionError || mapError

  function retryLoad() {
    retryLoadSchedules()
    if (selectedScheduleId) retryLoadSeatMap()
  }

  return {
    movie, days, selectedDate, setSelectedDate,
    schedules, selectedScheduleId, setSelectedScheduleId,
    mapData, mapLoading, selectedSeatIds, toggleSeat,
    loading, error, toastMsg, holdSeats, retryLoad,
  }
}
