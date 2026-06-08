import { Link } from "react-router"
import type { Screening } from "~/entities/screening/types"
import { formatTimeJst } from "~/shared/lib/date"

type Props = {
  screenings: Screening[]
  selectedDate: string
}

type ScheduledBlock = NonNullable<Screening["schedules"]>[number]

type PositionedSchedule = {
  schedule: ScheduledBlock
  lane: number
}

export default function TimetableView({ screenings, selectedDate }: Props) {
  if (!selectedDate) {
    return (
      <div className="rounded-app border-2 border-dashed border-border py-20 text-center">
        <p className="text-muted-foreground font-medium">日付を選択してタイムテーブルを表示</p>
      </div>
    )
  }

  const screeningsWithSchedules = screenings.filter(
    (s) => s.schedules && s.schedules.length > 0
  )

  const HOUR_START = 7
  const HOUR_END = 24
  const TOTAL_MINUTES = (HOUR_END - HOUR_START) * 60

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

  return (
    <div className="overflow-x-auto rounded-app border border-border bg-background">
      <div className="min-w-[1020px]">
        {/* ヘッダー行: 時刻 */}
        <div className="flex border-b border-border">
          <div className="w-32 shrink-0 border-r border-border bg-muted/60 p-2" />
          <div className="relative flex-1">
            <div className="flex">
              {Array.from({ length: 17 }, (_, i) => i + 7).map((h) => (
                <div
                  key={h}
                  className="flex-1 border-r border-border/50 px-1 py-2 text-center text-xs font-bold text-muted-foreground"
                >
                  {h}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 作品行 */}
        {screeningsWithSchedules.map((screening) => {
          const { positionedSchedules, laneCount } = layoutSchedules(screening.schedules!)
          const rowHeight = Math.max(72, laneCount * 52 + 16)

          return (
          <div key={screening.id} className="flex border-b border-border last:border-0">
            {/* 作品名 */}
            <div className="w-32 shrink-0 border-r border-border bg-muted/40 p-3">
              <p className="text-xs font-bold text-foreground line-clamp-3">{screening.title}</p>
            </div>
            {/* タイムライン */}
            <div className="relative flex-1 py-2" style={{ minHeight: `${rowHeight}px` }}>
              {/* グリッド線（1時間ごと） */}
              <div className="absolute inset-0 flex pointer-events-none">
                {Array.from({ length: 17 }).map((_, i) => (
                  <div key={i} className="flex-1 border-r border-border/30" />
                ))}
              </div>
              {/* 上映ブロック */}
              {positionedSchedules.map(({ schedule: sch, lane }) => {
                const startMin = toJstMinutes(sch.startsAt)
                const endMin = toJstMinutes(sch.endsAt)
                const left = ((startMin - HOUR_START * 60) / TOTAL_MINUTES) * 100
                const width = ((endMin - startMin) / TOTAL_MINUTES) * 100

                return (
                  <Link
                    key={sch.scheduleId}
                    to={`/reservations/booking/${screening.id}?date=${selectedDate}&scheduleId=${sch.scheduleId}&type=${screening.type ?? "movie"}`}
                    className="absolute rounded-app bg-primary/80 text-primary-foreground px-1.5 py-1 overflow-hidden cursor-pointer hover:bg-primary transition-colors flex flex-col justify-between"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      top: `${8 + lane * 52}px`,
                      height: "44px",
                    }}
                  >
                    <p className="text-[10px] font-bold truncate leading-tight">{sch.screenName}</p>
                    <p className="text-[10px] opacity-70 leading-tight">
                      {formatTimeJst(sch.startsAt)}〜{formatTimeJst(sch.endsAt)}
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
