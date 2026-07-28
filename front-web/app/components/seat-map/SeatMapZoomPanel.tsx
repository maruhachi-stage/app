import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react"
import { clamp, type SeatData, type SeatMapData } from "~/features/reservation/domain/seat-layout"
import { SeatLayoutRenderer } from "~/widgets/seat-map/SeatLayoutRenderer"

export type FocusPoint = {
  xPct: number
  yPct: number
}

type Props = {
  mapData: SeatMapData
  selectedSeatIds: number[]
  toggleSeat: (seat: SeatData) => void
  focusPoint: FocusPoint
}

const MIN_ZOOM_SEAT_SIZE = 26
const MIN_ZOOM_SCALE = 1.35
const MAX_ZOOM_SCALE = 2.2

export function SeatMapZoomPanel({ mapData, selectedSeatIds, toggleSeat, focusPoint }: Props) {
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
    <div className="relative h-full">
      <div
        ref={viewportRef}
        className="relative h-full w-full touch-none overflow-hidden rounded-md border border-primary/30 bg-background shadow-inner"
        onPointerDown={startPan}
        onPointerMove={movePan}
        onPointerUp={endPan}
        onPointerCancel={endPan}
      >
        <div
          className="absolute left-0 top-0 w-full"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <SeatLayoutRenderer
            mapData={mapData}
            selectedSeatIds={selectedSeatIds}
            toggleSeat={toggleSeat}
            interactive
            minHitSizePx={MIN_ZOOM_SEAT_SIZE}
          />
        </div>
      </div>
      <p className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-secondary/80 px-2 py-0.5 text-[11px] font-black text-primary backdrop-blur">
        {Math.round(scale * 100)}%
      </p>
    </div>
  )
}
