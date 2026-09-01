import { Link } from "react-router"
import { jstDateLabel } from "~/lib/date"
import TimetableView from "~/features/screening/components/TimetableView"
import { HomeNowShowingSection } from "~/components/HomeNowShowingSection"
import { useHomeScreenings } from "~/features/screening/hooks/useHomeScreenings"
import type { Route } from "./+types/home"
import Loading from "~/components/Loading"

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "HALシネマ" },
		{ name: "description", content: "HALシネマのWeb座席予約システム" },
	]
}

function moviesListPath(params?: { status?: string; date?: string }): string {
	const qs = new URLSearchParams({ type: "movie" })
	if (params?.status) qs.set("status", params.status)
	if (params?.date) qs.set("date", params.date)
	return `/screenings?${qs.toString()}`
}

type NewsItem = {
	id: number
	category: "goods" | "food" | "event" | "info"
	title: string
	description: string
	date: string
	isNew?: boolean
}

const NEWS_ITEMS: NewsItem[] = [
	{ id: 1, category: "goods", title: "ゴジラ-1.0 限定グッズ発売開始", description: "アクリルスタンド・クリアファイル・Tシャツなど全12種類。劇場ショップにて販売中。", date: "2025-06-01", isNew: true },
	{ id: 2, category: "food", title: "新フード「モンスターバーガー」登場", description: "ゴジラとのコラボバーガーが期間限定で登場！ドリンクセットでお得にどうぞ。", date: "2025-06-01", isNew: true },
	{ id: 3, category: "goods", title: "怪盗グルーのミニオン超変身 ぬいぐるみ販売", description: "ミニオンキャラクターのぬいぐるみ全5種類をショップにて販売開始しました。", date: "2025-05-28" },
	{ id: 4, category: "event", title: "ツイスターズ 舞台挨拶イベント開催決定", description: "6月15日（日）13:00の回にて舞台挨拶を予定しています。詳細は近日公開。", date: "2025-05-25" },
	{ id: 5, category: "info", title: "6月の営業時間変更のお知らせ", description: "6月中は設備メンテナンスのため、毎週火曜日の最終上映を21:00終了に変更します。", date: "2025-05-20" },
]

const CATEGORY_LABEL: Record<NewsItem["category"], string> = {
	goods: "グッズ", food: "フード", event: "イベント", info: "お知らせ",
}

const CATEGORY_COLOR: Record<NewsItem["category"], string> = {
	goods: "bg-purple-600/80", food: "bg-orange-500/80", event: "bg-blue-600/80", info: "bg-zinc-500/80",
}

function TimelineSkeleton() {
	return <div className="rounded-lg border border-border h-40 animate-pulse bg-muted/30" />
}

function NewsSection() {
	return (
		<section>
			<div className="flex items-center gap-3 mb-6">
				<span className="w-1 h-5 bg-primary/60 rounded-full" />
				<h2 className="text-sm font-bold tracking-[0.2em] text-foreground uppercase">News</h2>
				<span className="text-xs text-muted-foreground ml-1">最新情報</span>
			</div>
			<div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
				{NEWS_ITEMS.map((item) => (
					<div key={item.id} className="flex items-start gap-4 px-5 py-4 bg-card hover:bg-muted/30 transition-colors">
						<span className={`shrink-0 mt-0.5 text-[10px] font-bold text-white px-2 py-0.5 rounded-sm ${CATEGORY_COLOR[item.category]}`}>
							{CATEGORY_LABEL[item.category]}
						</span>
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2 mb-1">
								<p className="text-sm font-semibold text-foreground leading-snug">{item.title}</p>
								{item.isNew && <span className="shrink-0 text-[10px] font-bold text-primary border border-primary px-1.5 py-0.5 rounded-sm leading-none">NEW</span>}
							</div>
							<p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{item.description}</p>
						</div>
						<time className="shrink-0 text-xs text-muted-foreground tabular-nums mt-0.5">{item.date.replace(/-/g, ".")}</time>
					</div>
				))}
			</div>
		</section>
	)
}

export default function Home() {
	const { movies, todayScreenings, loading, error, todayStr, hasTodaySchedules } = useHomeScreenings()
	const todayLabel = jstDateLabel(todayStr)

	return (
		<>
			{loading && <Loading />}
			<div className="py-10 space-y-14">
				<HomeNowShowingSection movies={movies} loading={loading} error={error} />
				<section>
					<div className="flex items-center gap-3 mb-6">
						<span className="w-1 h-5 bg-muted-foreground/50 rounded-full" />
						<h2 className="text-sm font-bold tracking-[0.2em] text-foreground uppercase">Today's Schedule</h2>
						<span className="text-xs text-muted-foreground ml-1">{todayLabel}</span>
						<Link to={moviesListPath({ date: todayStr })} className="ml-auto text-xs text-primary hover:underline">スケジュール一覧 →</Link>
					</div>
					{!loading && !hasTodaySchedules && (
						<div className="h-[120px] flex items-center justify-center rounded-lg bg-muted/30 border border-dashed border-border">
							<p className="text-muted-foreground text-sm">本日の上映スケジュールはありません</p>
						</div>
					)}
					{!loading && hasTodaySchedules && (
						<TimetableView screenings={todayScreenings} selectedDate={todayStr} />
					)}
				</section>
				<NewsSection />
			</div>
		</>
	)
}
