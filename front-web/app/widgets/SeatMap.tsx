import type { SeatData, SeatMapData } from "~/features/reservation/useBooking"

type Props = {
  mapData: SeatMapData
  mapLoading: boolean
  selectedSeatIds: number[]
  toggleSeat: (seat: SeatData) => void
}

export function SeatMap({ mapData, mapLoading, selectedSeatIds, toggleSeat }: Props) {
  const seats = mapData.seats
  const minBtnW = 32
  const minBtnH = 20
  const avgSeatW = seats.length > 0
    ? seats.reduce((s, x) => s + x.seatWidthPct, 0) / seats.length : 5
  const avgSeatH = seats.length > 0
    ? seats.reduce((s, x) => s + x.seatHeightPct, 0) / seats.length : 5
  const containerW = Math.max(480, Math.min(800, Math.round(minBtnW / (avgSeatW / 100))))
  const containerH = Math.max(400, Math.min(900, Math.round(minBtnH / (avgSeatH / 100))))

  // 各行の先頭座席の Y 位置を収集（行ラベル表示用）
  const rowMap = new Map<string, number>()
  for (const seat of seats) {
    if (!rowMap.has(seat.row)) rowMap.set(seat.row, seat.positionTopPct)
  }
  const sortedRows = Array.from(rowMap.entries()).sort((a, b) => a[1] - b[1])

  const ROW_LABEL_W = 20

  return (
    <div className="mt-6 rounded-app bg-secondary shadow-2xl px-4 py-8 sm:px-8">
      {/* 凡例 */}
      <div className="flex justify-center gap-8 text-[11px] font-bold text-muted-foreground mb-8">
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-6 rounded-sm bg-emerald-500" />空席
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-6 rounded-sm bg-primary" />選択中
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-6 rounded-sm bg-zinc-700" />予約済
        </span>
      </div>

      {/* スクリーン */}
      <div className="mb-6 text-center">
        <div className="relative mx-auto max-w-sm">
          <div className="h-1 rounded-full bg-linear-to-r from-transparent via-white/30 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-8 bg-linear-to-b from-white/10 to-transparent" />
        </div>
        <p className="mt-3 text-[9px] font-black tracking-[0.6em] text-muted-foreground/50 uppercase">SCREEN</p>
      </div>

      {mapLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
        </div>
      ) : (
        <>
          {/* 座席マップ（横スクロール対応） */}
          <div className="overflow-auto -mx-4 sm:mx-0 pb-2">
            <div
              className="flex"
              style={{ width: containerW + ROW_LABEL_W * 2, margin: "0 auto" }}
            >
              {/* 列ラベル（A〜T など行番号） */}
              <div
                className="relative shrink-0"
                style={{ width: ROW_LABEL_W, height: containerH }}
              >
                {sortedRows.map(([row, topPct]) => (
                  <div
                    key={row}
                    className="absolute right-0 flex items-center justify-end text-[8px] font-black text-muted-foreground/40 select-none"
                    style={{ top: `${topPct}%`, transform: "translateY(-50%)", height: 14 }}
                  >
                    {row}
                  </div>
                ))}
              </div>

              {/* 座席本体（絶対座標） */}
              <div
                className="relative shrink-0"
                style={{ width: containerW, height: containerH }}
              >
                {seats.map((seat) => {
                  const isSelected = selectedSeatIds.includes(seat.seatId)
                  const isReserved = seat.status === "reserved"
                  return (
                    <button
                      key={seat.seatId}
                      onClick={() => toggleSeat(seat)}
                      disabled={isReserved}
                      title={`${seat.row}列${seat.col}番`}
                      style={{
                        position: "absolute",
                        left: `${seat.positionLeftPct}%`,
                        top: `${seat.positionTopPct}%`,
                        width: `${seat.seatWidthPct}%`,
                        height: `${seat.seatHeightPct}%`,
                        minWidth: `${minBtnW}px`,
                        minHeight: `${minBtnH}px`,
                        transform: "translate(-50%, -50%)",
                      }}
                      className={[
                        "flex items-center justify-center",
                        "rounded-t-sm rounded-b-md",
                        "text-[8px] font-bold leading-none select-none",
                        "transition-all duration-150 touch-manipulation",
                        isReserved
                          ? "bg-zinc-800 cursor-not-allowed text-zinc-600"
                          : isSelected
                          ? "bg-primary ring-2 ring-primary/40 ring-offset-1 ring-offset-secondary scale-110 z-10 text-white shadow-lg"
                          : "bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-emerald-950/60",
                      ].join(" ")}
                    >
                      {seat.col}
                    </button>
                  )
                })}
              </div>

              {/* 右スペーサー（行ラベル幅と対称にして座席ブロックをSCREEN中央に揃える） */}
              <div className="shrink-0" style={{ width: ROW_LABEL_W }} />
            </div>
          </div>

          {/* 入り口インジケーター */}
          <div className="mt-5 flex items-center justify-center gap-3">
            <div className="h-px flex-1 max-w-24 bg-border/40" />
            <div className="rounded-sm border border-border/30 bg-muted/10 px-6 py-1.5">
              <p className="text-[9px] font-black tracking-[0.5em] text-muted-foreground/40 uppercase">
                ENTRANCE
              </p>
            </div>
            <div className="h-px flex-1 max-w-24 bg-border/40" />
          </div>
        </>
      )}
    </div>
  )
}
