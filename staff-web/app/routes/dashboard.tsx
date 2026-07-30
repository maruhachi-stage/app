import type { Route } from "./+types/dashboard"
import { DashboardPage } from "~/features/dashboard/pages/DashboardPage"

export function meta(_: Route.MetaArgs) {
  return [{ title: "スタッフ画面 | HAL Cinema" }, { name: "description", content: "HAL Cinema スタッフ画面" }]
}

export default function DashboardRoute() {
  return <DashboardPage />
}
