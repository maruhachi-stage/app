import { useReservationFlow } from "~/processes/reservation-flow/context"

export function useEntry() {
  const { setBookingType } = useReservationFlow()

  function selectGuest() {
    setBookingType("guest")
  }

  return { selectGuest }
}
