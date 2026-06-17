import { memo, useEffect, useMemo, useRef, useState, type PointerEvent } from "react"
import type { LayoutObjectData, SeatData, SeatMapData } from "~/features/reservation/useSeatMap"

type Props = {
  mapData: SeatMapData
  mapLoading: boolean
  selectedSeatIds: number[]
  toggleSeat: (seat: SeatData) => void
}

type FocusPoint = {
  xPct: number
  yPct: number
}

type RendererProps = {
  mapData: SeatMapData
  selectedSeatIds: number[]
  toggleSeat: (seat: SeatData) => void
  interactive: boolean
  minSeatSizePx?: number
  className?: string
}

const MIN_ZOOM_SEAT_SIZE = 32
const MIN_ZOOM_SCALE = 1.6
const MAX_ZOOM_SCALE = 3

export function SeatMap({ mapData, mapLoading, selectedSeatIds, toggleSeat }: Props) {
  const [focusPoint, setFocusPoint] = useState<FocusPoint | null>(null)

  function focusFromTap(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    setFocusPoint({
      xPct: ((event.clientX - rect.left) / rect.width) * 100,
      yPct: ((event.clientY - rect.top) / rect.height) * 100,
    })
  }

  return (
    <div className="mt-6 rounded-app bg-secondary shadow-2xl px-4 py-6 sm:px-8">
      <SeatLegend />

      {mapLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold text-muted-foreground">座席表をタップして拡大</p>
              {focusPoint && (
                <button
                  type="button"
                  onClick={() => setFocusPoint(null)}
                  className="rounded-full border border-border/50 px-3 py-1 text-[11px] font-bold text-muted-foreground transition hover:border-primary hover:text-primary"
                >
                  拡大を閉じる
                </button>
              )}
            </div>
            <div
              className="mx-auto w-full max-w-4xl cursor-zoom-in overflow-hidden"
              onPointerDown={focusFromTap}
            >
              <SeatLayoutRenderer
                mapData={mapData}
                selectedSeatIds={selectedSeatIds}
                toggleSeat={toggleSeat}
                interactive={false}
              />
            </div>
          </div>

          {focusPoint && (
            <SeatMapZoomPanel
              mapData={mapData}
              selectedSeatIds={selectedSeatIds}
              toggleSeat={toggleSeat}
              focusPoint={focusPoint}
            />
          )}
        </div>
      )}
    </div>
  )
}

function SeatLegend() {
  return (
    <div className="mb-6 flex flex-wrap justify-center gap-4 text-[11px] font-bold text-muted-foreground sm:gap-8">
      <span className="flex items-center gap-2">
        <span className="inline-block h-3 w-6 rounded-sm bg-white ring-1 ring-border" />空席
      </span>
      <span className="flex items-center gap-2">
        <span className="inline-block h-3 w-6 rounded-sm bg-primary" />選択中
      </span>
      <span className="flex items-center gap-2">
        <span className="inline-block h-3 w-6 rounded-sm bg-zinc-700" />予約済
      </span>
      <span className="flex items-center gap-2">
        <span className="inline-block h-3 w-6 rounded-sm bg-amber-400" />仮押さえ
      </span>
    </div>
  )
}

function SeatLayoutRenderer({
  mapData,
  selectedSeatIds,
  toggleSeat,
  interactive,
  minSeatSizePx,
  className = "",
}: RendererProps) {
  const objects = mapData.objects ?? []

  return (
    <div
      className={`relative w-full overflow-hidden rounded-md border border-border/50 bg-background/70 ${className}`}
      style={{ aspectRatio: mapData.layout.aspectRatio }}
      onClick={event => {
        if (!interactive) return
        if ((event.target as Element).closest("button")) return
        const rect = event.currentTarget.getBoundingClientRect()
        const xPct = ((event.clientX - rect.left) / rect.width) * 100
        const yPct = ((event.clientY - rect.top) / rect.height) * 100
        const seat = findSeatAtPoint(mapData.seats, xPct, yPct)
        if (seat) toggleSeat(seat)
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_45%)]" />
      <LayoutObjectLayer objects={objects} />
      <div className="pointer-events-none absolute inset-0 z-10">
        {mapData.seats.map(seat => (
          <SeatButton
            key={seat.seatId}
            seat={seat}
            selected={selectedSeatIds.includes(seat.seatId)}
            interactive={interactive}
            minSeatSizePx={minSeatSizePx}
            onToggle={toggleSeat}
          />
        ))}
      </div>
    </div>
  )
}

function LayoutObjectLayer({ objects }: { objects: LayoutObjectData[] }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {objects.map(object => (
        <LayoutObject key={`${object.type}-${object.code}-${object.id}`} object={object} />
      ))}
    </div>
  )
}

function LayoutObject({ object }: { object: LayoutObjectData }) {
  const baseStyle = {
    left: `${object.leftPct}%`,
    top: `${object.topPct}%`,
    width: `${object.widthPct}%`,
    height: `${object.heightPct}%`,
    transform: `rotate(${object.rotationDeg}deg)`,
    zIndex: object.zIndex,
  }

  if (object.type === "screen") {
    return (
      <div
        className="absolute flex items-center justify-center rounded-full bg-linear-to-r from-transparent via-white/40 to-transparent text-[8px] font-black tracking-[0.45em] text-muted-foreground/70"
        style={baseStyle}
      >
        {object.label ?? "SCREEN"}
      </div>
    )
  }

  if (object.type === "entrance") {
    return (
      <div
        className="absolute flex items-center justify-center rounded-sm border border-border/40 bg-muted/20 text-[8px] font-black tracking-[0.35em] text-muted-foreground/60"
        style={baseStyle}
      >
        {object.label ?? "ENTRANCE"}
      </div>
    )
  }

  if (object.type === "label") {
    return (
      <div
        className="absolute flex items-center justify-center text-[9px] font-bold text-muted-foreground/70"
        style={baseStyle}
      >
        {object.label}
      </div>
    )
  }

  return (
    <div
      className="absolute rounded-sm border border-border/30 bg-muted/15"
      style={baseStyle}
      aria-label={object.label ?? object.code}
    />
  )
}

const SeatButton = memo(function SeatButton({
  seat,
  selected,
  interactive,
  minSeatSizePx,
  onToggle,
}: {
  seat: SeatData
  selected: boolean
  interactive: boolean
  minSeatSizePx?: number
  onToggle: (seat: SeatData) => void
}) {
  const status = seat.status
  const disabled = !interactive || status !== "available"
  const seatNo = seat.seatNo ?? seat.col
  const label = seat.displayLabel ?? `${seat.row}\n${seatNo}`
  const leftPct = seat.leftPct ?? seat.positionLeftPct
  const topPct = seat.topPct ?? seat.positionTopPct
  const widthPct = seat.widthPct ?? seat.seatWidthPct
  const heightPct = seat.heightPct ?? seat.seatHeightPct
  const rotationDeg = seat.rotationDeg ?? 0

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
        left: `${leftPct}%`,
        top: `${topPct}%`,
        width: `${widthPct}%`,
        height: `${heightPct}%`,
        minWidth: minSeatSizePx,
        minHeight: minSeatSizePx,
        transform: `translate(-50%, -50%) rotate(${rotationDeg}deg)`,
        zIndex: selected ? 30 : 20,
      }}
      className={[
        "pointer-events-auto absolute flex items-center justify-center whitespace-pre-line rounded-t-sm rounded-b-md border text-center text-[8px] font-black leading-none",
        "transition duration-150 touch-manipulation",
        interactive ? "cursor-pointer active:scale-95" : "pointer-events-none cursor-default",
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
    </button>
  )
})

function SeatMapZoomPanel({ mapData, selectedSeatIds, toggleSeat, focusPoint }: {
  mapData: SeatMapData
  selectedSeatIds: number[]
  toggleSeat: (seat: SeatData) => void
  focusPoint: FocusPoint
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{ x: number; y: number; translateX: number; translateY: number } | null>(null)
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  const [translate, setTranslate] = useState({ x: 0, y: 0 })

  const averageSeat = useMemo(() => {
    if (mapData.seats.length === 0) return { widthPct: 4, heightPct: 4 }
    return {
      widthPct: mapData.seats.reduce((sum, seat) => sum + (seat.widthPct ?? seat.seatWidthPct), 0) / mapData.seats.length,
      heightPct: mapData.seats.reduce((sum, seat) => sum + (seat.heightPct ?? seat.seatHeightPct), 0) / mapData.seats.length,
    }
  }, [mapData.seats])

  const scale = useMemo(() => {
    if (!viewport.width || !viewport.height) return MIN_ZOOM_SCALE
    const baseSeatPx = Math.min(
      viewport.width * averageSeat.widthPct / 100,
      viewport.height * averageSeat.heightPct / 100,
    )
    if (baseSeatPx <= 0) return MIN_ZOOM_SCALE
    return clamp(MIN_ZOOM_SEAT_SIZE / baseSeatPx, MIN_ZOOM_SCALE, MAX_ZOOM_SCALE)
  }, [averageSeat.heightPct, averageSeat.widthPct, viewport.height, viewport.width])

  useEffect(() => {
    const node = viewportRef.current
    if (!node) return

    function updateViewport() {
      if (!node) return
      setViewport({ width: node.clientWidth, height: node.clientHeight })
    }

    updateViewport()
    const observer = new ResizeObserver(updateViewport)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!viewport.width || !viewport.height) return
    const scaledWidth = viewport.width * scale
    const scaledHeight = viewport.height * scale
    const rawX = viewport.width / 2 - (focusPoint.xPct / 100) * scaledWidth
    const rawY = viewport.height / 2 - (focusPoint.yPct / 100) * scaledHeight

    setTranslate({
      x: clamp(rawX, viewport.width - scaledWidth, 0),
      y: clamp(rawY, viewport.height - scaledHeight, 0),
    })
  }, [focusPoint.xPct, focusPoint.yPct, scale, viewport.height, viewport.width])

  function startPan(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as Element).closest("button")) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      translateX: translate.x,
      translateY: translate.y,
    }
  }

  function movePan(event: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current || !viewport.width || !viewport.height) return
    const scaledWidth = viewport.width * scale
    const scaledHeight = viewport.height * scale
    const rawX = dragRef.current.translateX + event.clientX - dragRef.current.x
    const rawY = dragRef.current.translateY + event.clientY - dragRef.current.y
    setTranslate({
      x: clamp(rawX, viewport.width - scaledWidth, 0),
      y: clamp(rawY, viewport.height - scaledHeight, 0),
    })
  }

  function endPan() {
    dragRef.current = null
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold text-muted-foreground">拡大表示はドラッグで移動できます</p>
        <p className="text-[11px] font-black text-primary">{Math.round(scale * 100)}%</p>
      </div>
      <div
        ref={viewportRef}
        className="relative h-[360px] w-full touch-none overflow-hidden rounded-md border border-primary/30 bg-background shadow-inner sm:h-[430px]"
        onPointerDown={startPan}
        onPointerMove={movePan}
        onPointerUp={endPan}
        onPointerCancel={endPan}
      >
        <div
          className="absolute left-0 top-0 w-full"
          style={{
            width: `${scale * 100}%`,
            transform: `translate(${translate.x}px, ${translate.y}px)`,
          }}
        >
          <SeatLayoutRenderer
            mapData={mapData}
            selectedSeatIds={selectedSeatIds}
            toggleSeat={toggleSeat}
            interactive
            minSeatSizePx={MIN_ZOOM_SEAT_SIZE}
          />
        </div>
      </div>
    </div>
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function findSeatAtPoint(seats: SeatData[], xPct: number, yPct: number) {
  let best: { seat: SeatData; distance: number } | null = null

  for (const seat of seats) {
    if (seat.status !== "available") continue
    const leftPct = seat.leftPct ?? seat.positionLeftPct
    const topPct = seat.topPct ?? seat.positionTopPct
    const widthPct = seat.widthPct ?? seat.seatWidthPct
    const heightPct = seat.heightPct ?? seat.seatHeightPct
    const hitRadiusPct = seat.hitRadiusPct ?? Math.max(widthPct, heightPct) / 2
    const tolerancePct = Math.max(hitRadiusPct, widthPct, heightPct, 2)
    const dx = leftPct - xPct
    const dy = topPct - yPct

    if (Math.abs(dx) > tolerancePct || Math.abs(dy) > tolerancePct) continue

    const distance = dx * dx + dy * dy
    if (!best || distance < best.distance) {
      best = { seat, distance }
    }
  }

  return best?.seat ?? null
}
