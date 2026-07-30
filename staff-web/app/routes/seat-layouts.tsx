import type { Route } from "./+types/seat-layouts"
import { SeatLayoutsPage } from "~/features/seat-layouts/pages/SeatLayoutsPage"

export function meta(_: Route.MetaArgs) {
  return [{ title: "座席レイアウト | HAL Cinema スタッフ画面" }]
}

export default function SeatLayoutsRoute() {
  return <SeatLayoutsPage />
}
