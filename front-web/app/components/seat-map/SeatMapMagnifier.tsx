import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react"
import { FiMinimize2 } from "react-icons/fi"
import { clamp, type SeatData, type SeatMapData } from "~/features/reservation/domain/seat-layout"
import { SeatLayoutRenderer, type LayoutPoint } from "~/components/seat-map/SeatLayoutRenderer"

type Size = {
  width: number
  height: number
}

type Translate = {
  x: number
  y: number
}

type Props = {
  mapData: SeatMapData
  selectedSeatIds: number[]
  toggleSeat: (seat: SeatData) => void
  focusPoint: LayoutPoint
  onClose: () => void
}

const TARGET_SEAT_SIZE_PX = 34
const MIN_SCALE = 1.5
const MAX_SCALE = 2.6
const EDGE_PADDING = 8

export function SeatMapMagnifier({
  mapData,
  selectedSeatIds,
  toggleSeat,
  focusPoint,
  onClose,
}: Props) {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{ x: number; y: number; translateX: number; translateY: number } | null>(null)
  const [containerSize, setContainerSize] = useState<Size>({ width: 0, height: 0 })
  const [viewportSize, setViewportSize] = useState<Size>({ width: 0, height: 0 })
  const [translate, setTranslate] = useState<Translate>({ x: 0, y: 0 })

  const averageSeat = useMemo(() => {
    if (mapData.seats.length === 0) return { widthPct: 4, heightPct: 4 }

    return {
      widthPct: mapData.seats.reduce((sum, seat) => sum + (seat.widthPct ?? seat.seatWidthPct), 0) / mapData.seats.length,
      heightPct: mapData.seats.reduce((sum, seat) => sum + (seat.heightPct ?? seat.seatHeightPct), 0) / mapData.seats.length,
    }
  }, [mapData.seats])

  const scale = useMemo(() => {
    if (!containerSize.width || !containerSize.height) return MIN_SCALE

    const baseSeatPx = Math.min(
      containerSize.width * averageSeat.widthPct / 100,
      containerSize.height * averageSeat.heightPct / 100,
    )
    if (baseSeatPx <= 0) return MIN_SCALE

    return clamp(TARGET_SEAT_SIZE_PX / baseSeatPx, MIN_SCALE, MAX_SCALE)
  }, [averageSeat.heightPct, averageSeat.widthPct, containerSize.height, containerSize.width])

  const frame = useMemo(() => {
    if (!containerSize.width || !containerSize.height) {
      return { left: EDGE_PADDING, top: EDGE_PADDING, width: 0, height: 0 }
    }

    const compact = containerSize.width < 640
    const width = compact
      ? Math.max(0, containerSize.width - EDGE_PADDING * 2)
      : clamp(containerSize.width * 0.46, 360, Math.min(560, containerSize.width - EDGE_PADDING * 2))
    const height = compact
      ? Math.max(0, containerSize.height - EDGE_PADDING * 2)
      : clamp(containerSize.height * 0.72, 280, Math.min(480, containerSize.height - EDGE_PADDING * 2))
    const focusX = containerSize.width * focusPoint.xPct / 100
    const focusY = containerSize.height * focusPoint.yPct / 100

    return {
      left: clampFrame(focusX - width / 2, EDGE_PADDING, containerSize.width - width - EDGE_PADDING),
      top: clampFrame(focusY - height / 2, EDGE_PADDING, containerSize.height - height - EDGE_PADDING),
      width,
      height,
    }
  }, [containerSize.height, containerSize.width, focusPoint.xPct, focusPoint.yPct])

  useEffect(() => {
    const viewport = viewportRef.current
    const container = viewport?.parentElement
    if (!viewport || !container) return

    function updateSize() {
      const currentViewport = viewportRef.current
      const currentContainer = currentViewport?.parentElement
      if (!currentViewport || !currentContainer) return

      setViewportSize({ width: currentViewport.clientWidth, height: currentViewport.clientHeight })
      setContainerSize({ width: currentContainer.clientWidth, height: currentContainer.clientHeight })
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(viewport)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!containerSize.width || !containerSize.height || !viewportSize.width || !viewportSize.height) return

    const scaledWidth = containerSize.width * scale
    const scaledHeight = containerSize.height * scale
    const rawX = viewportSize.width / 2 - (focusPoint.xPct / 100) * scaledWidth
    const rawY = viewportSize.height / 2 - (focusPoint.yPct / 100) * scaledHeight

    setTranslate(clampTranslate({ x: rawX, y: rawY }, viewportSize, { width: scaledWidth, height: scaledHeight }))
  }, [containerSize.height, containerSize.width, focusPoint.xPct, focusPoint.yPct, scale, viewportSize.height, viewportSize.width])

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
    if (!dragRef.current || !viewportSize.width || !viewportSize.height) return

    const scaledSize = {
      width: containerSize.width * scale,
      height: containerSize.height * scale,
    }
    const rawTranslate = {
      x: dragRef.current.translateX + event.clientX - dragRef.current.x,
      y: dragRef.current.translateY + event.clientY - dragRef.current.y,
    }

    setTranslate(clampTranslate(rawTranslate, viewportSize, scaledSize))
  }

  function endPan() {
    dragRef.current = null
  }

  return (
    <div
      ref={viewportRef}
      className="absolute z-30 touch-none overflow-hidden rounded-xl border border-border/70 bg-background shadow-2xl ring-1 ring-black/40"
      style={{
        left: frame.left,
        top: frame.top,
        width: frame.width,
        height: frame.height,
      }}
      onPointerDown={startPan}
      onPointerMove={movePan}
      onPointerUp={endPan}
      onPointerCancel={endPan}
    >
      <div
        className="pointer-events-auto absolute left-0 top-0"
        style={{
          width: containerSize.width,
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <SeatLayoutRenderer
          mapData={mapData}
          selectedSeatIds={selectedSeatIds}
          toggleSeat={toggleSeat}
          interactive
          className="!rounded-none !border-0"
        />
      </div>
      <button
        type="button"
        aria-label="全体表示"
        title="全体表示"
        onClick={onClose}
        className="absolute right-2 top-2 z-40 hidden h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-secondary/90 text-muted-foreground shadow-lg backdrop-blur transition hover:border-primary hover:text-primary md:flex"
      >
        <FiMinimize2 className="h-4 w-4" aria-hidden />
      </button>
      <p className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-secondary/85 px-2 py-0.5 text-[11px] font-black text-primary backdrop-blur">
        {Math.round(scale * 100)}%
      </p>
    </div>
  )
}

function clampFrame(value: number, min: number, max: number) {
  if (max < min) return min
  return clamp(value, min, max)
}

function clampTranslate(translate: Translate, viewportSize: Size, scaledSize: Size): Translate {
  return {
    x: clampFrame(translate.x, viewportSize.width - scaledSize.width, 0),
    y: clampFrame(translate.y, viewportSize.height - scaledSize.height, 0),
  }
}
