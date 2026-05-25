import type { Route } from "./+types/home"
import { Link } from "react-router"
import { AppConfig } from "~/shared/config/app"

export function meta(_: Route.MetaArgs) {
  return [
    { title: "HALシネマ" },
    { name: "description", content: "HALシネマのWeb座席予約システム" },
  ]
}

export default function Home() {
  return (
    <div className="py-16 text-center">
      <h1 className="mb-4 text-4xl font-bold">{AppConfig.name}へようこそ</h1>
      <p className="mb-8 text-lg text-muted-foreground">
        上映中の映画をチェックして、座席を予約しましょう。
      </p>
      <Link
        to="/movies"
        className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 text-lg font-bold text-primary-foreground hover:opacity-90 transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5"
      >
        映画一覧を見る
      </Link>
    </div>
  )
}
