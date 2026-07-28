import { Outlet, useSearchParams } from "react-router"
import { Header } from "~/components/Header"
import { Footer } from "~/components/Footer"
import { ReservationHeader } from "~/components/ReservationHeader"

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
