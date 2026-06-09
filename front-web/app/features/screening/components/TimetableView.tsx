import { useRef } from "react"
import { Link } from "react-router"
import type { Screening } from "~/entities/screening/types"
import { formatTimeJst } from "~/shared/lib/date"
import { proxyImageUrl } from "~/shared/lib/image"

type Props = {
  screenings: Screening[]
  selectedDate: string
}

type ScheduledBlock = NonNullable<Screening["schedules"]>[number]

type PositionedSchedule = {
  schedule: ScheduledBlock
  lane: number
}

const HOUR_START = 7
const HOUR_END = 24
const TOTAL_MINUTES = (HOUR_END - HOUR_START) * 60
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => i + HOUR_START)

function toJstMinutes(isoStr: string): number {
  const d = new Date(isoStr)
  const jstOffset = 9 * 60
  const totalMin = Math.floor(d.getTime() / 60000) + jstOffset
  return totalMin % (24 * 60)
}

function layoutSchedules(schedules: ScheduledBlock[]): {
  positionedSchedules: PositionedSchedule[]
  laneCount: number
} {
  const laneEndMins: number[] = []
  const sortedSchedules = [...schedules].sort(
    (a, b) => toJstMinutes(a.startsAt) - toJstMinutes(b.startsAt),
  )

  const positionedSchedules = sortedSchedules.map((schedule) => {
    const startMin = toJstMinutes(schedule.startsAt)
    const endMin = toJstMinutes(schedule.endsAt)
    let lane = laneEndMins.findIndex((laneEndMin) => laneEndMin <= startMin)

    if (lane === -1) {
      lane = laneEndMins.length
      laneEndMins.push(endMin)
    } else {
      laneEndMins[lane] = endMin
    }

    return { schedule, lane }
  })

  return {
    positionedSchedules,
    laneCount: Math.max(1, laneEndMins.length),
  }
}

function buildDetailUrl(screening: Screening, selectedDate: string): string {
  const qs = new URLSearchParams({ type: screening.type ?? "movie" })
  if (selectedDate) qs.set("date", selectedDate)
  return `/screenings/${screening.id}?${qs.toString()}`
}

function ScreeningLabel({
  screening,
  selectedDate,
  compact = false,
}: {
  screening: Screening
  selectedDate: string
  compact?: boolean
}) {
  const detailUrl = buildDetailUrl(screening, selectedDate)
  const image = screening.thumbnailUrl ? (
    <img
      src={proxyImageUrl(screening.thumbnailUrl)}
      alt={compact ? screening.title : ""}
      className="h-full w-full object-cover"
      loading="lazy"
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center text-[9px] font-bold text-muted-foreground">
      NO
    </div>
  )

  if (compact) {
    return (
      <div className="flex h-full items-end justify-center bg-muted/40 p-1.5" aria-label={screening.title}>
        <Link
          to={detailUrl}
          className="aspect-[2/3] w-[min(100%,6.75rem)] overflow-hidden rounded-app bg-secondary shadow-sm transition-opacity hover:opacity-80"
        >
          {image}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-2 bg-muted/40 p-3">
      <Link
        to={detailUrl}
        className="aspect-[2/3] w-[min(100%,11rem)] overflow-hidden rounded-app bg-secondary shadow-sm transition-opacity hover:opacity-80"
      >
        {image}
      </Link>
      <p className="line-clamp-2 text-xs font-bold leading-tight text-foreground">{screening.title}</p>
    </div>
  )
}

export default function TimetableView({ screenings, selectedDate }: Props) {
  if (!selectedDate) {
    return (
      <div className="rounded-app border-2 border-dashed border-border py-20 text-center">
        <p className="font-medium text-muted-foreground">日付を選択してタイムテーブルを表示</p>
      </div>
    )
  }

  const screeningsWithSchedules = screenings.filter(
    (screening) => screening.schedules && screening.schedules.length > 0,
  )

  return (
    <>
      <TimetableTable screenings={screeningsWithSchedules} selectedDate={selectedDate} compact />
      <TimetableTable screenings={screeningsWithSchedules} selectedDate={selectedDate} />
    </>
  )
}

function TimetableTable({
  screenings,
  selectedDate,
  compact = false,
}: {
  screenings: Screening[]
  selectedDate: string
  compact?: boolean
}) {
  const labelWidth = compact ? "clamp(6.75rem, 30vw, 7.75rem)" : "clamp(10rem, 14vw, 13rem)"
  const rowBaseHeight = compact ? "clamp(11rem, 38vw, 13rem)" : "clamp(14rem, 24vw, 18rem)"
  const minWidth = compact ? `calc(${labelWidth} + ${HOURS.length * 28}px)` : undefined
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const nowLeft = ((nowMin - HOUR_START * 60) / TOTAL_MINUTES) * 100
  const showNowLine = nowLeft >= 0 && nowLeft <= 100
  const headerScrollRef = useRef<HTMLDivElement>(null)
  const tableWidthStyle = minWidth ? { minWidth } : { minWidth: "100%" }

  function handleBodyScroll(event: React.UIEvent<HTMLDivElement>) {
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = event.currentTarget.scrollLeft
    }
  }

  return (
    <div
      className={`overflow-clip rounded-app border border-border bg-background ${
        compact ? "md:hidden" : "hidden md:block"
      }`}
    >
      <div
        ref={headerScrollRef}
        className="sticky top-[calc(4rem+var(--header-scroll-offset,0px))] z-30 -mx-px overflow-hidden border-x border-b border-border bg-background shadow-sm md:top-16"
      >
        <div className="flex" style={tableWidthStyle}>
          <div
            className="sticky left-0 z-40 shrink-0 border-r border-border bg-muted/90 backdrop-blur"
            style={{ width: labelWidth }}
          />
          <div className="relative flex-1">
            <div className="flex">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className={`${compact ? "shrink-0" : "flex-1"} border-r border-border/50 bg-background/95 px-1 py-2 text-center text-xs font-bold text-muted-foreground backdrop-blur`}
                  style={compact ? { width: 28 } : undefined}
                >
                  {hour}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto" onScroll={handleBodyScroll}>
        <div style={tableWidthStyle}>
        {screenings.map((screening) => {
          const { positionedSchedules, laneCount } = layoutSchedules(screening.schedules!)
          const rowHeight = rowBaseHeight
          const laneGap = compact ? 6 : 8
          const laneInset = 8
          const minimumBlockHeight = compact ? 32 : 44
          const maximumBlockHeight = compact ? 56 : 72
          const availableLaneHeight = `calc((100% - ${laneInset * 2 + laneGap * (laneCount - 1)}px) / ${laneCount})`
          const blockHeight =
            laneCount >= 5
              ? availableLaneHeight
              : `clamp(${minimumBlockHeight}px, ${availableLaneHeight}, ${maximumBlockHeight}px)`

          return (
            <div key={screening.id} className="flex border-b border-border last:border-0">
              <div
                className="sticky left-0 z-20 shrink-0 border-r border-border bg-background"
                style={{ width: labelWidth, height: rowHeight }}
              >
                <ScreeningLabel screening={screening} selectedDate={selectedDate} compact={compact} />
              </div>

              <div className="relative flex-1 py-2" style={{ height: rowHeight }}>
                <div className="absolute inset-0 flex pointer-events-none">
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className={`${compact ? "shrink-0" : "flex-1"} border-r border-border/30`}
                      style={compact ? { width: 28 } : undefined}
                    />
                  ))}
                </div>

                {showNowLine && (
                  <div
                    className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-primary/80 shadow-[0_0_12px_rgba(225,29,72,0.7)]"
                    style={{ left: `${nowLeft}%` }}
                  />
                )}

                {positionedSchedules.map(({ schedule, lane }) => {
                  const startMin = toJstMinutes(schedule.startsAt)
                  const endMin = toJstMinutes(schedule.endsAt)
                  const left = ((startMin - HOUR_START * 60) / TOTAL_MINUTES) * 100
                  const width = ((endMin - startMin) / TOTAL_MINUTES) * 100
                  const laneRatio = lane / laneCount
                  const laneTopPercent = laneRatio * 100
                  const laneTopOffset =
                    laneInset -
                    laneRatio * (laneInset * 2 + laneGap * (laneCount - 1)) +
                    lane * laneGap

                  return (
                    <Link
                      key={schedule.scheduleId}
                      to={`/reservations/booking/${screening.id}?date=${selectedDate}&scheduleId=${schedule.scheduleId}&type=${screening.type ?? "movie"}`}
                      className="absolute flex flex-col justify-between overflow-hidden rounded-app bg-primary/80 px-1.5 py-1 text-primary-foreground transition-colors hover:bg-primary"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        minWidth: compact ? "72px" : undefined,
                        top: `calc(${laneTopPercent}% + ${laneTopOffset}px)`,
                        height: blockHeight,
                      }}
                    >
                      <p className="truncate text-[10px] font-bold leading-tight">
                        {compact ? schedule.screenName.replace("スクリーン", "SC") : schedule.screenName}
                      </p>
                      <p className={`${compact ? "text-[9px]" : "text-[10px]"} whitespace-nowrap leading-tight opacity-80`}>
                        {formatTimeJst(schedule.startsAt)}〜{formatTimeJst(schedule.endsAt)}
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
    </div>
  )
}
