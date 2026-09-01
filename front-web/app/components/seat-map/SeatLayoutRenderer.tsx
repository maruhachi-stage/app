import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { SeatData, SeatMapData } from '~/features/reservation/domain/seat-layout'
import { LayoutObjectLayer } from '~/components/seat-map/LayoutObjectLayer'
import { SeatButton } from '~/components/seat-map/SeatButton'

export type LayoutPoint = {
    xPct: number
    yPct: number
}

type Props = {
    mapData: SeatMapData
    selectedSeatIds: number[]
    toggleSeat: (seat: SeatData) => void
    interactive: boolean
    minHitSizePx?: number
    onBackgroundPress?: (point: LayoutPoint) => void
    className?: string
}

export function SeatLayoutRenderer({
    mapData,
    selectedSeatIds,
    toggleSeat,
    interactive,
    minHitSizePx,
    onBackgroundPress,
    className = '',
}: Props) {
    const rootRef = useRef<HTMLDivElement | null>(null)
    const [layoutSize, setLayoutSize] = useState({ width: 0, height: 0 })
    const objects = mapData.objects ?? []

    useEffect(() => {
        const node = rootRef.current
        if (!node) return

        function updateSize() {
            if (!node) return
            setLayoutSize({ width: node.clientWidth, height: node.clientHeight })
        }

        updateSize()
        const observer = new ResizeObserver(updateSize)
        observer.observe(node)
        return () => observer.disconnect()
    }, [])

    function selectSeatFromPoint(event: PointerEvent<HTMLDivElement>) {
        if ((event.target as Element).closest('button')) return

        const rect = event.currentTarget.getBoundingClientRect()
        const xPct = ((event.clientX - rect.left) / rect.width) * 100
        const yPct = ((event.clientY - rect.top) / rect.height) * 100
        onBackgroundPress?.({ xPct, yPct })
    }

    return (
        <div
            ref={rootRef}
            className={`relative w-full overflow-hidden rounded-md border border-border/50 bg-background/70 ${className}`}
            style={{ aspectRatio: mapData.layout.aspectRatio }}
            onClick={selectSeatFromPoint}
        >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_45%)]" />
            <LayoutObjectLayer objects={objects} />
            <div className="pointer-events-none absolute inset-0 z-10">
                {mapData.seats.map((seat) => (
                    <SeatButton
                        key={seat.seatId}
                        seat={seat}
                        selected={selectedSeatIds.includes(seat.seatId)}
                        interactive={interactive}
                        minHitSizePx={minHitSizePx}
                        layoutSize={layoutSize}
                        onToggle={toggleSeat}
                    />
                ))}
            </div>
        </div>
    )
}
