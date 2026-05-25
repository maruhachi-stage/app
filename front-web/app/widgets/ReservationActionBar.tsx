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
  maxSeats = 6,
  totalPrice,
  quoting = false,
  onNext,
  nextLabel = "次へ進む",
}: Props) {
  return (
    <div className="sticky bottom-6 mt-10 w-fit mx-auto flex items-center gap-4 rounded-app bg-secondary px-5 py-3 shadow-2xl border border-border">
      <div className="flex gap-1.5">
        {Array.from({ length: maxSeats }).map((_, i) => {
          const seat = seats[i]
          return (
            <div
              key={i}
              className={`flex h-8 w-8 items-center justify-center rounded-app text-[9px] font-black ${
                seat ? "bg-foreground text-background" : "bg-border/30 text-transparent"
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
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">合計金額</p>
            <p className="text-xl font-black text-foreground leading-none">
              {quoting ? "..." : `${totalPrice.toLocaleString()}円`}
            </p>
          </div>
        </>
      )}
      <Button size="lg" className="px-10 h-10 text-base font-black" onClick={onNext}>
        {nextLabel}
      </Button>
    </div>
  )
}
