import { useState, useEffect } from "react"
import { Link } from "react-router"
import { apiFetch, ApiError } from "~/shared/api/client"
import { jstDateLabel, todayJst } from "~/shared/lib/date"
import TimetableView from "~/features/screening/components/TimetableView"
import { HomeNowShowingSection } from "~/widgets/HomeNowShowingSection"
import type { Screening as Movie } from "~/entities/screening/types"
import type { Route } from "./+types/home"

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

function TimelineSkeleton() {
	return (
		<div className="rounded-lg border border-border h-40 animate-pulse bg-muted/30" />
	)
}

export default function Home() {
	const [movies, setMovies] = useState<Movie[]>([])
	const [todayScreenings, setTodayScreenings] = useState<Movie[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState("")

	const todayStr = todayJst()
	const todayLabel = jstDateLabel(todayStr)

	useEffect(() => {
		const fetchAll = async () => {
			try {
				const moviesData = await apiFetch<{ items: Movie[] }>("/movies")
				setMovies(moviesData.items)

				const todayData = await apiFetch<{ items: Movie[] }>(`/movies?date=${todayStr}`)
				setTodayScreenings(todayData.items.map((movie) => ({ ...movie, type: "movie" as const })))
			} catch (err) {
				setError(err instanceof ApiError ? err.message : "読み込みに失敗しました")
			} finally {
				setLoading(false)
			}
		}
		fetchAll()
	}, [todayStr])

	const hasTodaySchedules = todayScreenings.some((screening) => screening.schedules && screening.schedules.length > 0)

	return (
		<div className="container-center py-10 space-y-14">
			<HomeNowShowingSection movies={movies} loading={loading} error={error} />

			<section>
				<div className="flex items-center gap-3 mb-6">
					<span className="w-1 h-5 bg-muted-foreground/50 rounded-full" />
					<h2 className="text-sm font-bold tracking-[0.2em] text-foreground uppercase">Today's Schedule</h2>
					<span className="text-xs text-muted-foreground ml-1">{todayLabel}</span>
					<Link to={moviesListPath({ date: todayStr })} className="ml-auto text-xs text-primary hover:underline">
						スケジュール一覧 →
					</Link>
				</div>

				{loading && <TimelineSkeleton />}
				{!loading && !hasTodaySchedules && (
					<div className="h-[120px] flex items-center justify-center rounded-lg bg-muted/30 border border-dashed border-border">
						<p className="text-muted-foreground text-sm">本日の上映スケジュールはありません</p>
					</div>
				)}
				{!loading && hasTodaySchedules && (
					<TimetableView screenings={todayScreenings} selectedDate={todayStr} />
				)}
			</section>
		</div>
	)
}
