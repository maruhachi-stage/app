import { useState, useEffect } from "react"
import { Link } from "react-router"
import { AppConfig } from "~/shared/config/app"
import { apiFetch, ApiError } from "~/shared/api/client"
import { proxyImageUrl } from "~/shared/lib/image"
import type { Screening as Movie, Schedule } from "~/entities/screening/types"
import type { Route } from "./+types/home"

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "HALシネマ" },
		{ name: "description", content: "HALシネマのWeb座席予約システム" },
	]
}

function movieImageUrl(thumbnailUrl: string | null): string | null {
	return proxyImageUrl(thumbnailUrl) ?? null
}

function movieDetailPath(movieId: number): string {
	return `/screenings/${movieId}?type=movie`
}

function moviesListPath(params?: { status?: string; date?: string }): string {
	const qs = new URLSearchParams({ type: "movie" })
	if (params?.status) qs.set("status", params.status)
	if (params?.date) qs.set("date", params.date)
	return `/screenings?${qs.toString()}`
}

// ─── スケジュール表示用の型 ────────────────────────────────────────────────

type DisplaySchedule = {
	scheduleId: number
	movieId: number
	title: string
	thumbnailUrl: string | null
	screen: string
	startsAt: string
	endsAt: string
	durationMin: number
	remainingSeats: number
	totalSeats: number
}

// ─── お知らせ ──────────────────────────────────────────────────────────────

type NewsItem = {
  id: number
  category: "goods" | "food" | "event" | "info"
  title: string
  description: string
  date: string
  isNew?: boolean
}

const NEWS_ITEMS: NewsItem[] = [
  {
    id: 1,
    category: "goods",
    title: "ゴジラ-1.0 限定グッズ発売開始",
    description: "アクリルスタンド・クリアファイル・Tシャツなど全12種類。劇場ショップにて販売中。",
    date: "2025-06-01",
    isNew: true,
  },
  {
    id: 2,
    category: "food",
    title: "新フード「モンスターバーガー」登場",
    description: "ゴジラとのコラボバーガーが期間限定で登場！ドリンクセットでお得にどうぞ。",
    date: "2025-06-01",
    isNew: true,
  },
  {
    id: 3,
    category: "goods",
    title: "怪盗グルーのミニオン超変身 ぬいぐるみ販売",
    description: "ミニオンキャラクターのぬいぐるみ全5種類をショップにて販売開始しました。",
    date: "2025-05-28",
  },
  {
    id: 4,
    category: "event",
    title: "ツイスターズ 舞台挨拶イベント開催決定",
    description: "6月15日（日）13:00の回にて舞台挨拶を予定しています。詳細は近日公開。",
    date: "2025-05-25",
  },
  {
    id: 5,
    category: "info",
    title: "6月の営業時間変更のお知らせ",
    description: "6月中は設備メンテナンスのため、毎週火曜日の最終上映を21:00終了に変更します。",
    date: "2025-05-20",
  },
]

const CATEGORY_LABEL: Record<NewsItem["category"], string> = {
  goods: "グッズ",
  food:  "フード",
  event: "イベント",
  info:  "お知らせ",
}

const CATEGORY_COLOR: Record<NewsItem["category"], string> = {
  goods: "bg-purple-600/80",
  food:  "bg-orange-500/80",
  event: "bg-blue-600/80",
  info:  "bg-zinc-500/80",
}


// ─── 時刻フォーマット ──────────────────────────────────────────────────────

function formatTime(isoStr: string) {
	const d = new Date(isoStr)
	return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

// ─── タイムライン定数 ───────────────────────────────────────────────────────

const HOUR_START = 9
const HOUR_END = 22
const TOTAL_HOURS = HOUR_END - HOUR_START
const COL_WIDTH = 90

// ─── Timeline ──────────────────────────────────────────────────────────────

function ScheduleTimeline({ schedules }: { schedules: DisplaySchedule[] }) {
	const nowMin = (() => {
		const n = new Date()
		return n.getHours() * 60 + n.getMinutes()
	})()
	const nowOffset = ((nowMin - HOUR_START * 60) / 60) * COL_WIDTH

	// スクリーン名一覧（登場順・重複なし）
	const screenNames = Array.from(new Set(schedules.map(s => s.screen))).sort()

	const screenSchedules: Record<string, DisplaySchedule[]> = {}
	screenNames.forEach(s => { screenSchedules[s] = [] })
	schedules.forEach(s => {
		if (screenSchedules[s.screen]) screenSchedules[s.screen].push(s)
	})

	const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => HOUR_START + i)

	return (
		<div className="overflow-x-auto rounded-lg border border-border">
			<div style={{ minWidth: `${COL_WIDTH * TOTAL_HOURS + 80 + 32}px` }}>

				{/* 時間ヘッダー */}
				<div className="flex border-b border-border bg-muted/50">
					<div className="shrink-0 border-r border-border" style={{ width: 80 }} />
					{hours.map(h => (
						<div
							key={h}
							className="shrink-0 text-center text-xs text-muted-foreground py-2 border-r border-border/60"
							style={{ width: COL_WIDTH }}
						>
							{String(h).padStart(2, "0")}
						</div>
					))}
					<div className="text-xs text-muted-foreground py-2 px-1">
						{String(HOUR_END).padStart(2, "0")}
					</div>
				</div>

				{/* スクリーン行 */}
				{screenNames.map((screen, si) => {
					const rows = screenSchedules[screen]
					return (
						<div
							key={screen}
							className="flex relative border-b border-border last:border-b-0"
							style={{ height: 72 }}
						>
							{/* スクリーン名 */}
							<div
								className="shrink-0 flex items-center px-3 border-r border-border bg-muted/30 z-10"
								style={{ width: 80 }}
							>
								<span className="text-xs font-semibold text-foreground leading-tight tracking-wide">
									{screen.replace("スクリーン", "SC")}
								</span>
							</div>

							{/* グリッド背景 */}
							<div className="relative flex-1">
								{hours.map(h => (
									<div
										key={h}
										className="absolute top-0 bottom-0 border-r border-border/30"
										style={{ left: (h - HOUR_START) * COL_WIDTH }}
									/>
								))}
								<div className={`absolute inset-0 ${si % 2 === 0 ? "bg-muted/20" : "bg-muted/10"}`} />

								{/* 現在時刻ライン */}
								{nowOffset > 0 && nowOffset < TOTAL_HOURS * COL_WIDTH && (
									<div
										className="absolute top-0 bottom-0 w-px bg-primary/70 z-20"
										style={{ left: nowOffset }}
									/>
								)}

								{/* スケジュールブロック */}
								{rows.map((s, i) => {
									const startD = new Date(s.startsAt)
									const startMin = startD.getHours() * 60 + startD.getMinutes()
									const left = ((startMin - HOUR_START * 60) / 60) * COL_WIDTH
									const endD = new Date(s.endsAt)
									const endMin = endD.getHours() * 60 + endD.getMinutes()
									const actualDuration = endMin - startMin
									const width = (actualDuration / 60) * COL_WIDTH - 6
									const isPast = startD < new Date()
									const isFull = s.remainingSeats === 0
									const dateStr = s.startsAt.slice(0, 10)
									const linkTo = isFull
										? movieDetailPath(s.movieId)
										: `/reservations/booking/${s.movieId}?date=${dateStr}&scheduleId=${s.scheduleId}&type=movie`

									return (
										<Link
											key={i}
											to={linkTo}
											className={`absolute top-2 bottom-2 rounded overflow-hidden flex flex-col justify-center px-2.5 z-10 transition-all
                        ${isPast ? "opacity-35 pointer-events-none" : "hover:brightness-125 hover:-translate-y-px"}
                        ${isFull ? "bg-zinc-600 border border-zinc-500" : "bg-primary border border-primary/80"}
                      `}
											style={{ left: left + 2, width: Math.max(width, 44) }}
											title={`${s.title} ${formatTime(s.startsAt)}〜${formatTime(s.endsAt)}`}
										>
											<p className="text-xs font-bold text-white truncate leading-tight drop-shadow">
												{s.title}
											</p>
											<p className="text-[11px] font-medium text-white/80 truncate leading-tight tabular-nums mt-0.5">
												{formatTime(s.startsAt)}〜{formatTime(s.endsAt)}
											</p>
										</Link>
									)
								})}
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}

// ─── Hero Components ───────────────────────────────────────────────────────

function HeroMain({ movie }: { movie: Movie }) {
	const imgUrl = movieImageUrl(movie.thumbnailUrl)
	return (
		<Link
			to={movieDetailPath(movie.id)}
			className="relative block overflow-hidden rounded-lg col-span-1 row-span-2 group bg-black h-full"
		>

			{imgUrl ? (
				<>
					{/* ぼかし背景 */}
					<img
						src={imgUrl}
						alt=""
						className="hidden sm:block absolute inset-0 h-full w-full object-cover scale-110 blur-xl opacity-60"
					/>
					{/* ポスター本体（見切れなし） */}
					<img
						src={imgUrl}
						alt={movie.title}
						className="relative h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
					/>
				</>
			) : (
				<div className="h-full w-full bg-muted flex items-center justify-center">
					<span className="text-muted-foreground text-sm">No Image</span>
				</div>
			)}

			<div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
			<div className="absolute bottom-0 left-0 right-0 p-6">
				<span className="inline-block bg-primary text-primary-foreground text-[11px] font-bold tracking-widest px-2.5 py-1 rounded-sm mb-3">上映中</span>
				<h2 className="text-2xl font-bold leading-snug text-white drop-shadow-lg mb-2">{movie.title}</h2>
				<p className="text-white/70 text-xs mb-4 line-clamp-2">{movie.description}</p>
				<span className="inline-flex items-center gap-1.5 bg-primary/90 hover:bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded transition-colors">▶ 予約する</span>
			</div>
		</Link>
	)
}


function HeroSub({ movie }: { movie: Movie }) {
  const imgUrl = movieImageUrl(movie.thumbnailUrl)
  return (
    <Link to={movieDetailPath(movie.id)} className="relative block overflow-hidden rounded-lg group aspect-square sm:aspect-auto">
      {imgUrl ? (
        <>
          {/* ぼかし背景 */}
          <img
            src={imgUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover scale-110 blur-xl opacity-60"
          />
          {/* 本体（見切れなし） */}
          <img
            src={imgUrl}
            alt={movie.title}
            className="relative h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        </>
      ) : (
        <div className="h-full w-full bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-sm">No Image</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <span className="inline-block text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-sm mb-2 bg-primary/80 text-primary-foreground">上映中</span>
        <h3 className="text-base font-bold leading-snug text-white drop-shadow-lg line-clamp-2">{movie.title}</h3>
        <p className="text-white/60 text-xs mt-1">{movie.durationMin}分</p>
      </div>
    </Link>
  )
}

// ─── News ──────────────────────────────────────────────────────────────────

function NewsSection() {
  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <span className="w-1 h-5 bg-primary/60 rounded-full" />
        <h2 className="text-sm font-bold tracking-[0.2em] text-foreground uppercase">News</h2>
        <span className="text-xs text-muted-foreground ml-1">最新情報</span>
      </div>

      <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
        {NEWS_ITEMS.map(item => (
          <div
            key={item.id}
            className="flex items-start gap-4 px-5 py-4 bg-card hover:bg-muted/30 transition-colors"
          >
            {/* カテゴリバッジ */}
            <span className={`shrink-0 mt-0.5 text-[10px] font-bold text-white px-2 py-0.5 rounded-sm ${CATEGORY_COLOR[item.category]}`}>
              {CATEGORY_LABEL[item.category]}
            </span>

            {/* 本文 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-foreground leading-snug">
                  {item.title}
                </p>
                {item.isNew && (
                  <span className="shrink-0 text-[10px] font-bold text-primary border border-primary px-1.5 py-0.5 rounded-sm leading-none">
                    NEW
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {item.description}
              </p>
            </div>

            {/* 日付 */}
            <time className="shrink-0 text-xs text-muted-foreground tabular-nums mt-0.5">
              {item.date.replace(/-/g, ".")}
            </time>
          </div>
        ))}
      </div>
    </section>
  )
}

function HeroSkeleton() {
	return (
		<div className="grid grid-cols-2 grid-rows-2 gap-4 h-[520px] animate-pulse">
			<div className="col-span-1 row-span-2 rounded-lg bg-muted" />
			<div className="rounded-lg bg-muted" />
			<div className="rounded-lg bg-muted" />
		</div>
	)
}

function TimelineSkeleton() {
	return (
		<div className="rounded-lg border border-border h-40 animate-pulse bg-muted/30" />
	)
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function Home() {
	const [movies, setMovies] = useState<Movie[]>([])
	const [schedules, setSchedules] = useState<DisplaySchedule[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState("")

	const today = new Date()
	const todayStr = today.toISOString().slice(0, 10)
	const todayLabel = `${today.getMonth() + 1}月${today.getDate()}日（${"日月火水木金土"[today.getDay()]}）`

	useEffect(() => {
		const fetchAll = async () => {
			try {
				// 映画一覧（NOW SHOWING用）
				const moviesData = await apiFetch<{ items: Movie[] }>("/movies")
				setMovies(moviesData.items)

				// 今日のスケジュール付き映画一覧
				const todayData = await apiFetch<{ items: Movie[] }>(`/movies?date=${todayStr}`)
				const displaySchedules: DisplaySchedule[] = []
				for (const movie of todayData.items) {
					if (!movie.schedules) continue
					for (const s of movie.schedules) {
						displaySchedules.push({
							scheduleId: s.scheduleId,
							movieId: movie.id,
							title: movie.title,
							thumbnailUrl: movie.thumbnailUrl,
							screen: s.screenName,
							startsAt: String(s.startsAt),
							endsAt: String(s.endsAt),
							durationMin: movie.durationMin,
							remainingSeats: s.remainingSeats,
							totalSeats: s.totalSeats,
						})
					}
				}
				setSchedules(displaySchedules)
			} catch (err) {
				setError(err instanceof ApiError ? err.message : "読み込みに失敗しました")
			} finally {
				setLoading(false)
			}
		}
		fetchAll()
	}, [todayStr])

	const nowShowing = movies.filter(m => m.status === "now_showing")
	const [heroMain, ...heroRest] = nowShowing
	const heroSubs = heroRest.slice(0, 2)

	return (
		<div className="container-center py-10 space-y-14">

			{/* ── NOW SHOWING ──────────────────────────────── */}
			<section>
				<div className="flex items-center gap-3 mb-6">
					<span className="w-1 h-5 bg-primary rounded-full" />
					<h2 className="text-sm font-bold tracking-[0.2em] text-foreground uppercase">Now Showing</h2>
					<Link to={moviesListPath({ status: "now_showing" })} className="ml-auto text-xs text-primary hover:underline">
						すべての作品を見る →
					</Link>
				</div>

				{loading && <HeroSkeleton />}
				{error && (
					<div className="h-[200px] flex items-center justify-center rounded-lg bg-muted border border-border">
						<p className="text-muted-foreground text-sm">{error}</p>
					</div>
				)}
				{!loading && !error && nowShowing.length === 0 && (
					<div className="py-16 text-center space-y-4">
						<h1 className="text-4xl font-bold">{AppConfig.name}へようこそ</h1>
						<p className="text-lg text-muted-foreground">上映中の映画をチェックして、座席を予約しましょう。</p>
						<Link to={moviesListPath()} className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 text-lg font-bold text-primary-foreground hover:opacity-90 transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5">
							映画一覧を見る
						</Link>
					</div>
				)}
				{!loading && !error && heroMain && (
					<div className="grid grid-cols-[3fr_2fr] gap-4 sm:grid-rows-2 sm:h-[520px]">
						<HeroMain movie={heroMain} />
						{heroSubs.map(m => <HeroSub key={m.id} movie={m} />)}
					</div>
				)}
			</section>

			{/* ── TODAY'S SCHEDULE ─────────────────────────── */}
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

				{!loading && schedules.length === 0 && (
					<div className="h-[120px] flex items-center justify-center rounded-lg bg-muted/30 border border-dashed border-border">
						<p className="text-muted-foreground text-sm">本日の上映スケジュールはありません</p>
					</div>
				)}

				{!loading && schedules.length > 0 && (
					<>
						<div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
							<span className="flex items-center gap-1.5">
								<svg width="12" height="12" viewBox="0 0 12 12"><rect width="12" height="12" rx="2" className="fill-primary" /></svg>
								上映あり
							</span>
							<span className="flex items-center gap-1.5">
								<span className="inline-block w-3 h-3 rounded-sm bg-zinc-600 border border-zinc-500" />
								満席
							</span>
							<span className="flex items-center gap-1.5">
								<svg width="2" height="12" viewBox="0 0 2 12"><rect width="2" height="12" className="fill-primary" /></svg>
								現在時刻
							</span>
						</div>
						<ScheduleTimeline schedules={schedules} />
					</>
				)}
			</section>

            {/* ── NEWS ─────────────────────────────────────── */}
            <NewsSection />  {/* ✅ ここを追加 */}


		</div>
	)
}
