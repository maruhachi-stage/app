import { useEffect, useRef } from "react"
import { Button } from "~/shared/ui/Button"

type Seat = { row: string | number; col: string | number }

type Props = {
  seats: Seat[]
  maxSeats?: number
  totalPrice?: number
  quoting?: boolean
  onNext: () => void
  nextLabel?: string
}

export function ReservationActionBar({
  seats,
  maxSeats = 8,
  totalPrice,
  quoting = false,
  onNext,
  nextLabel = "次へ進む",
}: Props) {
  const barRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (window.innerWidth >= 640) return

    const frame = window.requestAnimationFrame(() => {
      const bar = barRef.current
      const seatMapSlot = document.querySelector<HTMLElement>("[data-seat-map-slot='true']")
      if (!bar || !seatMapSlot) return

      const barRect = bar.getBoundingClientRect()
      const slotRect = seatMapSlot.getBoundingClientRect()
      const overlap = slotRect.bottom - barRect.top + 12
      if (overlap > 0) window.scrollBy({ top: overlap, behavior: "smooth" })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [seats.length])

  return (
    <div ref={barRef} className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-[calc(100vw-24px)] items-center gap-2 rounded-app border border-border bg-secondary/95 px-3 py-3 shadow-2xl backdrop-blur sm:sticky sm:bottom-6 sm:mt-10 sm:w-fit sm:max-w-none sm:gap-4 sm:bg-secondary sm:px-5">
      <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto sm:flex-none sm:overflow-visible">
        {Array.from({ length: maxSeats }).map((_, i) => {
          const seat = seats[i]
          return (
            <div
              key={i}
              className={`h-8 w-8 shrink-0 items-center justify-center rounded-app text-[9px] font-black ${
                seat ? "flex bg-foreground text-background" : "hidden sm:flex bg-border/30 text-transparent"
              }`}
            >
              {seat ? `${seat.row}-${seat.col}` : ""}
            </div>
          )
        })}
      </div>
      {totalPrice !== undefined && (
        <>
          <div className="h-8 border-l border-border/50" />
          <div className="shrink-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1 whitespace-nowrap">合計金額</p>
            <p className="text-xl font-black text-foreground leading-none whitespace-nowrap">
              {quoting ? "..." : `${totalPrice.toLocaleString()}円`}
            </p>
          </div>
        </>
      )}
      <Button size="lg" className="h-10 shrink-0 whitespace-nowrap px-4 text-base font-black sm:px-10" onClick={onNext}>
        {nextLabel}
      </Button>
    </div>
  )
}
