import { memo } from "react"
import { clamp, getSeatLabel, getSeatNo, getSeatRect, type SeatData } from "~/features/reservation/domain/seat-layout"

type LayoutSize = {
  width: number
  height: number
}

type Props = {
  seat: SeatData
  selected: boolean
  interactive: boolean
  minHitSizePx?: number
  layoutSize: LayoutSize
  onToggle: (seat: SeatData) => void
}

export const SeatButton = memo(function SeatButton({
  seat,
  selected,
  interactive,
  minHitSizePx,
  layoutSize,
  onToggle,
}: Props) {
  const status = seat.status
  const disabled = !interactive || status !== "available"
  const seatNo = getSeatNo(seat)
  const label = interactive ? getSeatLabel(seat) : ""
  const rect = getSeatRect(seat)
  const fontSize = getSeatFontSize(rect.widthPct, rect.heightPct, layoutSize)
  const visualSize = getSeatVisualSize(rect.widthPct, rect.heightPct, layoutSize)

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={event => event.stopPropagation()}
      onClick={event => {
        event.stopPropagation()
        onToggle(seat)
      }}
      title={`${seat.row}列${seatNo}番`}
      aria-label={`${seat.row}列${seatNo}番`}
      style={{
        left: `${rect.leftPct}%`,
        top: `${rect.topPct}%`,
        width: `${rect.widthPct}%`,
        height: `${rect.heightPct}%`,
        minWidth: minHitSizePx,
        minHeight: minHitSizePx,
        transform: `translate(-50%, -50%) rotate(${rect.rotationDeg}deg)`,
        zIndex: selected ? 30 : 20,
      }}
      className={[
        "pointer-events-auto absolute flex items-center justify-center rounded-md bg-transparent p-0",
        "touch-manipulation",
        interactive ? "cursor-pointer active:scale-95" : "pointer-events-none cursor-default",
      ].join(" ")}
    >
      <span
        style={{
          width: visualSize.width,
          height: visualSize.height,
          fontSize,
        }}
        className={[
          "flex items-center justify-center whitespace-pre-line rounded-md border text-center font-black leading-none",
          "transition duration-150",
        status === "reserved"
          ? "border-zinc-700 bg-zinc-800 text-zinc-500"
          : status === "held"
            ? "border-amber-500/70 bg-amber-400 text-amber-950"
            : selected
              ? "z-20 border-primary bg-primary text-white shadow-lg ring-2 ring-primary/40"
              : "border-border bg-white text-zinc-900 hover:border-primary",
        ].join(" ")}
      >
        {label}
      </span>
    </button>
  )
})

function getSeatFontSize(widthPct: number, heightPct: number, layoutSize: LayoutSize) {
  if (!layoutSize.width || !layoutSize.height) return 8

  const seatWidthPx = layoutSize.width * widthPct / 100
  const seatHeightPx = layoutSize.height * heightPct / 100
  const base = Math.min(seatWidthPx, seatHeightPx) * 0.38

  return clamp(base, 6, 13)
}

function getSeatVisualSize(widthPct: number, heightPct: number, layoutSize: LayoutSize) {
  if (!layoutSize.width || !layoutSize.height) return { width: "100%", height: "100%" }

  const seatSizePx = Math.min(
    layoutSize.width * widthPct / 100,
    layoutSize.height * heightPct / 100,
  )

  return {
    width: `${seatSizePx}px`,
    height: `${seatSizePx}px`,
  }
}
