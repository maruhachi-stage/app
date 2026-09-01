import { Link } from "react-router"
import type { Screening } from "~/features/screening/domain/screening"
import { formatDateJst, todayJst } from "~/lib/date"
import { proxyImageUrl } from "~/lib/image"
import { ScheduleGrid } from "./ScheduleGrid"

type Props = {
  screening: Screening
  selectedDate: string
}

function buildDetailUrl(screening: Screening, selectedDate: string): string {
  const type = screening.type ?? "movie"
  const qs = new URLSearchParams({ type })
  if (selectedDate) qs.set("date", selectedDate)
  return `/screenings/${screening.id}?${qs.toString()}`
}

export function ScreeningGridCard({ screening, selectedDate }: Props) {
  const today = todayJst()
  const type = screening.type ?? "movie"
  const detailUrl = buildDetailUrl(screening, selectedDate)
  const bookingUrl = `/reservations/booking/${screening.id}?date=${today}&type=${type}`

  return (
    <div className="group flex flex-col gap-3">
      <div className="relative aspect-2/3 overflow-hidden rounded-app bg-muted shadow-lg transition-transform duration-300 group-hover:-translate-y-1">
        <Link to={detailUrl} className="absolute inset-0">
          {screening.thumbnailUrl ? (
            <img
              src={proxyImageUrl(screening.thumbnailUrl)}
              alt={screening.title}
              className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-60"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-5xl">??</div>
          )}
        </Link>

        <div className="pointer-events-none absolute inset-0 flex items-end justify-end p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Link
            to={bookingUrl}
            className="pointer-events-auto w-fit rounded-md bg-primary px-5 py-2 text-center text-sm font-bold text-primary-foreground shadow-xl transition-all duration-300 translate-y-2 group-hover:translate-y-0 hover:scale-110"
          >
            予約
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 px-0.5">
        <Link to={detailUrl} className="line-clamp-2 text-sm font-bold leading-tight text-foreground transition-colors hover:text-primary">
          {screening.title}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {screening.status === "now_showing" ? (
            <span className="rounded bg-green-900/40 px-1.5 py-0.5 text-[10px] font-bold text-green-400">上映中</span>
          ) : (
            <span className="rounded bg-orange-900/40 px-1.5 py-0.5 text-[10px] font-bold text-orange-400">上映予定</span>
          )}
          <span className="text-[10px] font-medium text-muted-foreground">{screening.durationMin}分</span>
        </div>
      </div>
    </div>
  )
}

export function ScreeningListCard({ screening, selectedDate }: Props) {
  const detailUrl = buildDetailUrl(screening, selectedDate)

  return (
    <div className="flex flex-col overflow-hidden rounded-app border border-border bg-secondary/50 shadow-sm sm:flex-row">
      <Link to={detailUrl} className="block w-full shrink-0 sm:w-40 md:w-48">
        <div className="aspect-2/3 sm:aspect-auto sm:h-full bg-secondary">
          {screening.thumbnailUrl ? (
            <img src={proxyImageUrl(screening.thumbnailUrl)} alt={screening.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-4xl">??</div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4">
          <Link to={detailUrl} className="hover:text-primary transition-colors">
            <h2 className="text-xl font-extrabold text-foreground">{screening.title}</h2>
          </Link>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground font-medium">
            <span>{screening.durationMin}分</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                screening.status === "now_showing" ? "bg-green-600/20 text-green-400" : "bg-orange-600/20 text-orange-400"
              }`}
            >
              {screening.status === "now_showing" ? "上映中" : "上映予定"}
            </span>
          </div>
        </div>

        {screening.schedules && screening.schedules.length > 0 ? (
          <>
            {selectedDate && (
              <div className="mb-2 text-xs font-bold text-muted-foreground">
                {formatDateJst(selectedDate)}
              </div>
            )}
            <ScheduleGrid schedules={screening.schedules} itemId={screening.id} selectedDate={selectedDate} screeningType={screening.type} />
          </>
        ) : (
          <p className="mt-auto text-sm text-muted-foreground font-medium italic">
            {selectedDate ? "この日の上映はありません。" : "日付を選択してスケジュールを表示"}
          </p>
        )}
      </div>
    </div>
  )
}
