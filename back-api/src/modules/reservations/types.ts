export type SeatLayout = {
  screenId: number
  layoutId: number
  layoutVersion: number
  backgroundImageUrl: string | null
  aspectRatio: string
  designWidth: number
  designHeight: number
}

export type LayoutObjectInfo = {
  id: number
  type: string
  code: string
  label: string | null
  leftPct: number
  topPct: number
  widthPct: number
  heightPct: number
  rotationDeg: number
  zIndex: number
  style: Record<string, unknown>
}

export type SeatSectionInfo = {
  id: number
  code: string
  name: string
}

export type SeatInfo = {
  seatId: number
  seatCode: string
  row: string
  col: number
  seatNo: number
  displayLabel: string | null
  sectionCode: string | null
  seatType: 'standard' | 'premium' | 'wheelchair_companion' | 'unavailable'
  leftPct: number
  topPct: number
  widthPct: number
  heightPct: number
  rotationDeg: number
  positionTopPct: number
  positionLeftPct: number
  seatWidthPct: number
  seatHeightPct: number
  hitRadiusPct: number | null
  status: 'available' | 'reserved' | 'held'
}

export type SeatMapInfo = {
  layout: SeatLayout
  objects: LayoutObjectInfo[]
  sections: SeatSectionInfo[]
  seats: SeatInfo[]
}

export type ReservationForCancel = {
  id: number
  memberId: number | null
  bookingType: string
  customerEmail: string
  status: string
  startsAt: Date | string
}
