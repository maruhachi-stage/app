import { Link } from "react-router"
import type { Movie } from "~/entities/movie/types"
import { formatDateJst, todayJst } from "~/shared/lib/date"
import { proxyImageUrl } from "~/shared/lib/image"
import { ScheduleGrid } from "./ScheduleGrid"

type Props = {
  movie: Movie
  selectedDate: string
}

export function MovieGridCard({ movie, selectedDate }: Props) {
  const today = todayJst()

  return (
    <div className="group flex flex-col gap-3">
      <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-muted shadow-lg transition-transform duration-300 group-hover:-translate-y-1">
        {/* ポスターリンク */}
        <Link
          to={`/movies/${movie.id}${selectedDate ? `?date=${selectedDate}` : ""}`}
          className="absolute inset-0"
        >
          {movie.thumbnailUrl ? (
            <img
              src={proxyImageUrl(movie.thumbnailUrl)}
              alt={movie.title}
              className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-60"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-5xl">🎬</div>
          )}
        </Link>

        {/* 予約ボタン（ポスターリンクとは独立） */}
        <div className="pointer-events-none absolute inset-0 flex items-end justify-end p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Link
            to={`/reservations/booking/${movie.id}?date=${today}`}
            className="pointer-events-auto w-fit rounded-md bg-primary px-5 py-2 text-center text-sm font-bold text-primary-foreground shadow-xl transition-all duration-300 translate-y-2 group-hover:translate-y-0 hover:scale-110"
          >
            予約
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 px-0.5">
        <Link
          to={`/movies/${movie.id}${selectedDate ? `?date=${selectedDate}` : ""}`}
          className="line-clamp-2 text-sm font-bold leading-tight text-foreground transition-colors hover:text-primary"
        >
          {movie.title}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {movie.status === "now_showing" ? (
            <span className="rounded bg-green-900/40 px-1.5 py-0.5 text-[10px] font-bold text-green-400">
              上映中
            </span>
          ) : (
            <span className="rounded bg-orange-900/40 px-1.5 py-0.5 text-[10px] font-bold text-orange-400">
              上映予定
            </span>
          )}
          <span className="text-[10px] font-medium text-muted-foreground">
            {movie.durationMin}分
          </span>
        </div>
      </div>
    </div>
  )
}

export function MovieListCard({ movie, selectedDate }: Props) {
  return (
    <div className="flex flex-col overflow-hidden rounded-app border border-border bg-secondary/50 shadow-sm sm:flex-row">
      <Link
        to={`/movies/${movie.id}${selectedDate ? `?date=${selectedDate}` : ""}`}
        className="block w-full shrink-0 sm:w-40 md:w-48"
      >
        <div className="aspect-2/3 sm:aspect-auto sm:h-full bg-secondary">
          {movie.thumbnailUrl ? (
            <img src={proxyImageUrl(movie.thumbnailUrl)} alt={movie.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-4xl">🎬</div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4">
          <Link
            to={`/movies/${movie.id}${selectedDate ? `?date=${selectedDate}` : ""}`}
            className="hover:text-primary transition-colors"
          >
            <h2 className="text-xl font-extrabold text-foreground">{movie.title}</h2>
          </Link>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground font-medium">
            <span>{movie.durationMin}分</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                movie.status === "now_showing" ? "bg-green-600/20 text-green-400" : "bg-orange-600/20 text-orange-400"
              }`}
            >
              {movie.status === "now_showing" ? "上映中" : "上映予定"}
            </span>
          </div>
        </div>

        {movie.schedules && movie.schedules.length > 0 ? (
          <>
            {selectedDate && (
              <div className="mb-2 text-xs font-bold text-muted-foreground">
                {formatDateJst(selectedDate)}
              </div>
            )}
            <ScheduleGrid schedules={movie.schedules} movieId={movie.id} selectedDate={selectedDate} />
          </>
        ) : (
          <p className="mt-auto text-sm text-muted-foreground font-medium italic">
            {selectedDate ? "本日の上映はありません。" : "日付を選択してスケジュールを表示"}
          </p>
        )}
      </div>
    </div>
  )
}
