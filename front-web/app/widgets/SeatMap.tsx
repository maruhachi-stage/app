import type { SeatData, SeatMapData } from "~/features/reservation/useBooking"

type Props = {
  mapData: SeatMapData
  mapLoading: boolean
  selectedSeatIds: number[]
  toggleSeat: (seat: SeatData) => void
}

export function SeatMap({ mapData, mapLoading, selectedSeatIds, toggleSeat }: Props) {
  return (
    <>
      <div className="mt-6 flex justify-center gap-6 text-xs font-bold text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-emerald-400" />
          空席
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-primary" />
          選択中
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-muted-foreground/50" />
          予約済
        </span>
      </div>

      {mapLoading ? (
        <div className="flex aspect-video w-full items-center justify-center rounded-app bg-secondary mt-6">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
        </div>
      ) : (
        <div
          className="relative mx-auto mt-6 w-full max-w-2xl overflow-hidden rounded-app bg-secondary p-8 shadow-2xl"
          style={{ aspectRatio: mapData.layout.aspectRatio.replace("/", " / ") }}
        >
          <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-muted px-10 py-1 text-[10px] font-black tracking-[0.5em] text-muted-foreground">
            SCREEN
          </div>
          {mapData.seats.map((seat) => (
            <button
              key={seat.seatId}
              onClick={() => toggleSeat(seat)}
              disabled={seat.status === "reserved"}
              style={{
                position: "absolute",
                left: `${seat.positionLeftPct}%`,
                top: `${seat.positionTopPct}%`,
                width: `${seat.seatWidthPct}%`,
                height: `${seat.seatHeightPct}%`,
                transform: "translate(-50%, -50%)",
              }}
              className={`rounded-sm transition-all duration-200 ${
                seat.status === "reserved"
                  ? "bg-muted-foreground/30 opacity-40 cursor-not-allowed"
                  : selectedSeatIds.includes(seat.seatId)
                  ? "bg-primary ring-4 ring-primary/30 scale-125 z-10"
                  : "bg-emerald-400 hover:bg-emerald-300 hover:scale-110"
              }`}
            />
          ))}
        </div>
      )}
    </>
  )
}
