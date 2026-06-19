import type { Route } from "./+types/home"
import { AdminHomePage } from "~/components/admin/pages/AdminHomePage"

export function meta(_: Route.MetaArgs) {
  return [
    { title: "映画館管理画面 | HAL Cinema" },
    { name: "description", content: "HAL Cinema 映画館管理画面" },
  ]
}

export default function Home() {
  return <AdminHomePage />
}
