import { Link } from "react-router"
import type { Schedule } from "~/entities/movie/types"
import { formatTimeJst } from "~/shared/lib/date"

type Props = {
  schedules: Schedule[]
  movieId: number
  selectedDate: string
  selectedScheduleId?: number
  onSelect?: (scheduleId: number) => void
}

type Status = "available" | "few" | "full"

function getStatus(sch: Schedule): Status {
  if (sch.remainingSeats <= 0) return "full"
  if (sch.remainingSeats / sch.totalSeats <= 0.3) return "few"
  return "available"
}

const statusConfig: Record<
  Status,
  { label: string; cardClass: string; badgeClass: string; indicator: string }
> = {
  available: {
    label: "空席あり",
    cardClass:
      "border-green-500/40 bg-green-500/10 hover:border-green-500 hover:bg-green-500/15",
    badgeClass: "bg-green-500/20 text-green-700 dark:text-green-400",
    indicator: "●",
  },
  few: {
    label: "残りわずか",
    cardClass:
      "border-yellow-500/40 bg-yellow-500/10 hover:border-yellow-500 hover:bg-yellow-500/15",
    badgeClass: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
    indicator: "▲",
  },
  full: {
    label: "満席",
    cardClass:
      "border-red-400/30 bg-red-500/10 opacity-60 cursor-not-allowed pointer-events-none",
    badgeClass: "bg-red-500/20 text-red-700 dark:text-red-400",
    indicator: "✕",
  },
}

export function ScheduleGrid({
  schedules,
  movieId,
  selectedDate,
  selectedScheduleId,
  onSelect,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {schedules.map((sch) => {
        const status = getStatus(sch)
        const cfg = statusConfig[status]
        const isFull = status === "full"
        const isSelected = sch.scheduleId === selectedScheduleId
        const ariaLabel = `${formatTimeJst(sch.startsAt)}開始 ${sch.screenName} ${cfg.label}${!isFull ? ` 残り${sch.remainingSeats}席` : ""}`

        const content = (
          <>
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-xl font-black text-foreground leading-none tracking-tight">
                {formatTimeJst(sch.startsAt)}
              </span>
              <span className="text-xs text-muted-foreground leading-tight" aria-hidden="true">
                〜{formatTimeJst(sch.endsAt)}
              </span>
            </div>

            <span className="mt-1.5 text-[10px] text-muted-foreground leading-tight">
              {sch.screenName}
            </span>

            <div className="mt-2 flex items-center justify-between w-full gap-1">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${cfg.badgeClass}`}
              >
                <span aria-hidden="true">{cfg.indicator}</span>
                {cfg.label}
              </span>
              {!isFull && (
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  残{sch.remainingSeats}
                </span>
              )}
            </div>
          </>
        )

        const className = `flex flex-col items-start rounded-lg border p-3 transition-all ${cfg.cardClass} ${
          isSelected ? "ring-2 ring-primary scale-[1.02] border-primary" : ""
        }`

        if (onSelect) {
          return (
            <button
              key={sch.scheduleId}
              type="button"
              onClick={() => onSelect(sch.scheduleId)}
              className={className}
              disabled={isFull}
              aria-label={ariaLabel}
            >
              {content}
            </button>
          )
        }

        return (
          <Link
            key={sch.scheduleId}
            to={`/reservations/booking/${movieId}?date=${selectedDate}&scheduleId=${sch.scheduleId}`}
            className={className}
            aria-label={ariaLabel}
            aria-disabled={isFull}
            tabIndex={isFull ? -1 : undefined}
          >
            {content}
          </Link>
        )
      })}
    </div>
  )
}
