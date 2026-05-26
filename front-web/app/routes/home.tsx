import { useState, useEffect } from "react"
import { Link } from "react-router"
import { AppConfig } from "~/shared/config/app"
import { apiFetch, ApiError } from "~/shared/api/client"
import type { Movie, Schedule } from "~/entities/movie/types"
import type { Route } from "./+types/home"

export function meta(_: Route.MetaArgs) {
  return [
    { title: "HALシネマ" },
    { name: "description", content: "HALシネマのWeb座席予約システム" },
  ]
}

const IMAGE_BASE = import.meta.env.VITE_IMAGE_SERVER_URL ?? "http://localhost:4000"

function movieImageUrl(thumbnailUrl: string | null): string | null {
  if (!thumbnailUrl) return null
  if (thumbnailUrl.startsWith("http")) return thumbnailUrl
  return `${IMAGE_BASE}${thumbnailUrl.startsWith("/") ? "" : "/"}${thumbnailUrl}`
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
                    ? `/movies/${s.movieId}`
                    : `/reservations/booking/${s.movieId}?date=${dateStr}&scheduleId=${s.scheduleId}`

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
      to={`/movies/${movie.id}`}
      className="relative block overflow-hidden rounded-lg col-span-1 row-span-2 group"
    >
      {imgUrl ? (
        <img src={imgUrl} alt={movie.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
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
    <Link to={`/movies/${movie.id}`} className="relative block overflow-hidden rounded-lg group">
      {imgUrl ? (
        <img src={imgUrl} alt={movie.title} className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />
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
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-14">

      {/* ── NOW SHOWING ──────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <span className="w-1 h-5 bg-primary rounded-full" />
          <h2 className="text-sm font-bold tracking-[0.2em] text-foreground uppercase">Now Showing</h2>
          <Link to="/movies?status=now_showing" className="ml-auto text-xs text-primary hover:underline">
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
            <Link to="/movies" className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 text-lg font-bold text-primary-foreground hover:opacity-90 transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5">
              映画一覧を見る
            </Link>
          </div>
        )}
        {!loading && !error && heroMain && (
          <div className="grid grid-cols-2 grid-rows-2 gap-4 h-[520px]">
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
          <Link to={`/movies?date=${todayStr}`} className="ml-auto text-xs text-primary hover:underline">
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
    </div>
  )
}