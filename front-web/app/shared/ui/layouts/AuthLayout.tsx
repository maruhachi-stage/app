import { Outlet, useSearchParams } from "react-router"
import { Header } from "~/widgets/Header"
import { Footer } from "~/widgets/Footer"
import { ReservationHeader } from "~/widgets/ReservationHeader"

export default function AuthLayout() {
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get("redirect") || ""
  const isReservationFlow = redirect.startsWith("/reservations/")

  if (isReservationFlow) {
    return (
      <>
        <ReservationHeader />
        <main className="container-center flex-1">
          <Outlet />
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="container-center flex-1">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
