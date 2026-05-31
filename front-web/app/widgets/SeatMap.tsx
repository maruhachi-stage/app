import type { ReactNode } from "react"
import type { SeatData, SeatMapData } from "~/features/reservation/useBooking"

type Props = {
  mapData: SeatMapData
  mapLoading: boolean
  selectedSeatIds: number[]
  toggleSeat: (seat: SeatData) => void
}

export function SeatMap({ mapData, mapLoading, selectedSeatIds, toggleSeat }: Props) {
  const rows = [...new Set(mapData.seats.map(s => s.row))].sort()
  const cols = [...new Set(mapData.seats.map(s => s.col))].sort((a, b) => a - b)
  const seatAt = new Map(mapData.seats.map(s => [`${s.row}:${s.col}`, s]))
  const maxCol = cols.length > 0 ? Math.max(...cols) : 0
  // 左右から2列目の後に通路を配置（例: 10列 → col2とcol8の後）
  const aisleAfterCols = maxCol >= 6 ? new Set([2, maxCol - 2]) : new Set<number>()

  return (
    <div className="mt-6 rounded-app bg-secondary shadow-2xl px-4 py-8 sm:px-8">
      {/* 凡例 */}
      <div className="flex justify-center gap-8 text-[11px] font-bold text-muted-foreground mb-8">
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-6 rounded-sm bg-emerald-500" />
          空席
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-6 rounded-sm bg-primary" />
          選択中
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-6 rounded-sm bg-zinc-700" />
          予約済
        </span>
      </div>

      {/* スクリーン */}
      <div className="mb-8 text-center">
        <div className="relative mx-auto max-w-sm">
          <div className="h-1 rounded-full bg-linear-to-r from-transparent via-white/30 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-8 bg-linear-to-b from-white/10 to-transparent" />
        </div>
        <p className="mt-3 text-[9px] font-black tracking-[0.6em] text-muted-foreground/50 uppercase">
          SCREEN
        </p>
      </div>

      {mapLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
        </div>
      ) : (
        <div className="overflow-x-auto pb-2">
          {/* w-max + mx-auto = 収まるなら中央寄せ、はみ出したら左から横スクロール */}
          <div className="w-max mx-auto">

            {/* 列番号ヘッダー */}
            <div className="flex items-end gap-3 mb-1.5">
              <div className="w-6 shrink-0" />
              <div className="flex items-end gap-1">
                {cols.flatMap(col => {
                  const items: ReactNode[] = []
                  if (aisleAfterCols.has(col - 1)) {
                    items.push(
                      <div key={`header-aisle-${col}`} className="w-7 shrink-0 text-center">
                        <span className="text-[7px] font-bold text-muted-foreground/30">通路</span>
                      </div>
                    )
                  }
                  items.push(
                    <div key={`hcol-${col}`} className="w-12 shrink-0 text-center text-[9px] font-bold text-muted-foreground/40">
                      {col}
                    </div>
                  )
                  return items
                })}
              </div>
              <div className="w-6 shrink-0" />
            </div>

            {/* 座席グリッド */}
            <div className="flex flex-col gap-1.5">
              {rows.map(row => (
                <div key={row} className="flex items-center gap-3">
                  {/* 行ラベル（左） */}
                  <div className="w-6 shrink-0 text-center text-[11px] font-black text-muted-foreground/50 select-none">
                    {row}
                  </div>

                  {/* 座席ボタン列（通路あり） */}
                  <div className="flex items-center gap-1">
                    {cols.flatMap(col => {
                      const items: ReactNode[] = []

                      // 通路スペース（左右から2列目の後）
                      if (aisleAfterCols.has(col - 1)) {
                        items.push(
                          <div
                            key={`aisle-${row}-${col}`}
                            className="w-7 shrink-0 self-stretch flex items-center justify-center"
                          >
                            <div className="h-full w-px border-l border-dashed border-border/30" />
                          </div>
                        )
                      }

                      const seat = seatAt.get(`${row}:${col}`)
                      if (!seat) {
                        items.push(<div key={`gap-${row}-${col}`} className="h-8 w-12 shrink-0" />)
                      } else {
                        const isSelected = selectedSeatIds.includes(seat.seatId)
                        const isReserved = seat.status === "reserved"
                        items.push(
                          <button
                            key={seat.seatId}
                            onClick={() => toggleSeat(seat)}
                            disabled={isReserved}
                            title={`${row}列${col}番`}
                            className={[
                              "h-8 w-12 shrink-0 select-none",
                              "rounded-t-sm rounded-b-md",
                              "text-[8px] font-bold leading-none",
                              "transition-all duration-150 touch-manipulation",
                              isReserved
                                ? "bg-zinc-800 cursor-not-allowed text-zinc-600"
                                : isSelected
                                ? "bg-primary ring-2 ring-primary/40 ring-offset-1 ring-offset-secondary scale-110 z-10 text-white shadow-lg"
                                : "bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-emerald-950/60",
                            ].join(" ")}
                          >
                            {col}
                          </button>
                        )
                      }

                      return items
                    })}
                  </div>

                  {/* 行ラベル（右） */}
                  <div className="w-6 shrink-0 text-center text-[11px] font-black text-muted-foreground/50 select-none">
                    {row}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
