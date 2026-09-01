import { useReservationFlow } from '~/components/ReservationFlowProvider'

export function useEntry() {
    const { setBookingType } = useReservationFlow()

    function selectGuest() {
        setBookingType('guest')
    }

    return { selectGuest }
}
