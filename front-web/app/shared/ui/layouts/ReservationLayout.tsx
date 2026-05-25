import { Outlet } from "react-router"
import { ReservationHeader } from "~/widgets/ReservationHeader"
import { ReservationStepBanner } from "~/widgets/ReservationStepBanner"
import { ReservationFlowProvider } from "~/processes/reservation-flow/context"

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
