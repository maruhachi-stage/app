export type SeatStatus = 'available' | 'reserved' | 'held'
export type SeatType = 'standard' | 'premium' | 'wheelchair_companion' | 'unavailable'

export type LayoutObjectData = {
    id: number
    type:
        | 'screen'
        | 'aisle'
        | 'entrance'
        | 'label'
        | 'divider'
        | 'stairs'
        | 'wheelchair_space'
        | 'background_zone'
    code: string
    label: string | null
    leftPct: number
    topPct: number
    widthPct: number
    heightPct: number
    rotationDeg: number
    zIndex: number
    style?: Record<string, unknown>
}

export type SeatSectionData = {
    id: number
    code: string
    name: string
}

export type SeatData = {
    seatId: number
    seatCode?: string
    row: string
    col: number
    seatNo?: number
    displayLabel?: string | null
    sectionCode?: string | null
    seatType?: SeatType
    leftPct?: number
    topPct?: number
    widthPct?: number
    heightPct?: number
    rotationDeg?: number
    hitRadiusPct?: number | null
    positionTopPct: number
    positionLeftPct: number
    seatWidthPct: number
    seatHeightPct: number
    status: SeatStatus
}

export type SeatMapData = {
    scheduleId: number
    layout: {
        screenId?: number
        layoutId?: number
        aspectRatio: string
        layoutVersion: number
        designWidth?: number
        designHeight?: number
        backgroundImageUrl?: string | null
    }
    objects?: LayoutObjectData[]
    sections?: SeatSectionData[]
    seats: SeatData[]
}

export type SeatRect = {
    leftPct: number
    topPct: number
    widthPct: number
    heightPct: number
    rotationDeg: number
}

export function getSeatNo(seat: SeatData) {
    return seat.seatNo ?? seat.col
}

export function getSeatLabel(seat: SeatData) {
    return seat.displayLabel ?? `${seat.row}\n${getSeatNo(seat)}`
}

export function getSeatRect(seat: SeatData): SeatRect {
    const rawWidthPct = seat.widthPct ?? seat.seatWidthPct
    const rawHeightPct = seat.heightPct ?? seat.seatHeightPct
    const visualSizePct = normalizeSeatVisualSize(rawWidthPct, rawHeightPct)

    return {
        leftPct: seat.leftPct ?? seat.positionLeftPct,
        topPct: seat.topPct ?? seat.positionTopPct,
        widthPct: visualSizePct,
        heightPct: visualSizePct,
        rotationDeg: seat.rotationDeg ?? 0,
    }
}

function normalizeSeatVisualSize(widthPct: number, heightPct: number) {
    if (widthPct <= 0 && heightPct <= 0) return 3
    if (widthPct <= 0) return heightPct
    if (heightPct <= 0) return widthPct

    return Math.min(widthPct, heightPct)
}

export function findSeatAtPoint(seats: SeatData[], xPct: number, yPct: number) {
    let best: { seat: SeatData; distance: number } | null = null

    for (const seat of seats) {
        if (seat.status !== 'available') continue
        const rect = getSeatRect(seat)
        const hitRadiusPct = seat.hitRadiusPct ?? Math.max(rect.widthPct, rect.heightPct) / 2
        const tolerancePct = Math.max(hitRadiusPct, rect.widthPct, rect.heightPct, 2)
        const dx = rect.leftPct - xPct
        const dy = rect.topPct - yPct

        if (Math.abs(dx) > tolerancePct || Math.abs(dy) > tolerancePct) continue

        const distance = dx * dx + dy * dy
        if (!best || distance < best.distance) {
            best = { seat, distance }
        }
    }

    return best?.seat ?? null
}

export function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}
