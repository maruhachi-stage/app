import { useState } from 'react'
import { FiMinimize2 } from 'react-icons/fi'
import type { SeatData, SeatMapData } from '~/features/reservation/domain/seat-layout'
import { SeatLayoutRenderer, type LayoutPoint } from '~/components/seat-map/SeatLayoutRenderer'
import { SeatMapMagnifier } from '~/components/seat-map/SeatMapMagnifier'
import { SeatLegend } from '~/components/seat-map/SeatLegend'

type Props = {
    mapData: SeatMapData
    mapLoading: boolean
    selectedSeatIds: number[]
    toggleSeat: (seat: SeatData) => void
}

export function SeatMap({ mapData, mapLoading, selectedSeatIds, toggleSeat }: Props) {
    const [focusPoint, setFocusPoint] = useState<LayoutPoint | null>(null)

    return (
        <div className="mt-6 rounded-app bg-secondary px-4 py-6 shadow-2xl sm:px-8">
            <SeatLegend />

            {mapLoading ? (
                <div className="flex h-48 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
                </div>
            ) : (
                <>
                    <DesktopSeatMap
                        mapData={mapData}
                        selectedSeatIds={selectedSeatIds}
                        toggleSeat={toggleSeat}
                        focusPoint={focusPoint}
                        setFocusPoint={setFocusPoint}
                    />
                    <MobileSeatMap
                        mapData={mapData}
                        selectedSeatIds={selectedSeatIds}
                        toggleSeat={toggleSeat}
                        focusPoint={focusPoint}
                        setFocusPoint={setFocusPoint}
                    />
                </>
            )}
        </div>
    )
}

function DesktopSeatMap({
    mapData,
    selectedSeatIds,
    toggleSeat,
    focusPoint,
    setFocusPoint,
}: Omit<Props, 'mapLoading'> & {
    focusPoint: LayoutPoint | null
    setFocusPoint: (focusPoint: LayoutPoint | null) => void
}) {
    return (
        <div className="hidden md:block">
            <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[11px] font-bold text-muted-foreground">
                    {focusPoint
                        ? '拡大表示はドラッグで移動できます'
                        : '座席以外をクリックすると拡大できます'}
                </p>
            </div>
            <div className="relative mx-auto w-full max-w-4xl overflow-hidden">
                <SeatLayoutRenderer
                    mapData={mapData}
                    selectedSeatIds={selectedSeatIds}
                    toggleSeat={toggleSeat}
                    interactive
                    minHitSizePx={24}
                    onBackgroundPress={setFocusPoint}
                />
                {focusPoint && (
                    <SeatMapMagnifier
                        mapData={mapData}
                        selectedSeatIds={selectedSeatIds}
                        toggleSeat={toggleSeat}
                        focusPoint={focusPoint}
                        onClose={() => setFocusPoint(null)}
                    />
                )}
            </div>
        </div>
    )
}

function MobileSeatMap({
    mapData,
    selectedSeatIds,
    toggleSeat,
    focusPoint,
    setFocusPoint,
}: Omit<Props, 'mapLoading'> & {
    focusPoint: LayoutPoint | null
    setFocusPoint: (focusPoint: LayoutPoint | null) => void
}) {
    return (
        <div className="md:hidden">
            <div className="mb-3 flex h-7 items-center justify-between gap-3">
                <p className="text-[11px] font-bold text-muted-foreground">
                    {focusPoint ? '拡大表示はドラッグで移動できます' : '座席表をタップして拡大'}
                </p>
                {focusPoint && (
                    <button
                        type="button"
                        aria-label="全体表示"
                        title="全体表示"
                        onClick={() => setFocusPoint(null)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/50 text-muted-foreground transition hover:border-primary hover:text-primary"
                    >
                        <FiMinimize2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                )}
            </div>

            <div data-seat-map-slot="true" className="relative overflow-hidden">
                <div className="cursor-zoom-in overflow-hidden">
                    <SeatLayoutRenderer
                        mapData={mapData}
                        selectedSeatIds={selectedSeatIds}
                        toggleSeat={toggleSeat}
                        interactive={false}
                        onBackgroundPress={setFocusPoint}
                    />
                </div>
                {focusPoint && (
                    <SeatMapMagnifier
                        mapData={mapData}
                        selectedSeatIds={selectedSeatIds}
                        toggleSeat={toggleSeat}
                        focusPoint={focusPoint}
                        onClose={() => setFocusPoint(null)}
                    />
                )}
            </div>
        </div>
    )
}
