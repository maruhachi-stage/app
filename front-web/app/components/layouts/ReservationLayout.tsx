import { Outlet } from 'react-router'
import { ReservationHeader } from '~/components/ReservationHeader'
import { ReservationStepBanner } from '~/components/ReservationStepBanner'
import { ReservationFlowProvider } from '~/components/ReservationFlowProvider'

export default function ReservationLayout() {
    return (
        <ReservationFlowProvider>
            <ReservationHeader />
            <ReservationStepBanner />
            <main className="reservation-container flex-1">
                <Outlet />
            </main>
        </ReservationFlowProvider>
    )
}
