import type mysql from 'mysql2/promise'
import type { LayoutObjectInfo, SeatInfo, SeatLayout } from '#modules/reservations/types.js'

export function presentSeatLayout(screenId: number, layout: mysql.RowDataPacket): SeatLayout {
  return {
    screenId,
    layoutId: layout.id as number,
    layoutVersion: layout.layout_version as number,
    backgroundImageUrl: layout.background_image_url as string | null,
    aspectRatio: `${layout.aspect_ratio_width}/${layout.aspect_ratio_height}`,
    designWidth: Number(layout.aspect_ratio_width),
    designHeight: Number(layout.aspect_ratio_height),
  }
}

export function presentSeat(row: mysql.RowDataPacket): SeatInfo {
  const rawWidthPct = Number(row.seat_width_pct)
  const rawHeightPct = Number(row.seat_height_pct)
  const visualSizePct = normalizeSeatVisualSize(rawWidthPct, rawHeightPct)

  return {
    seatId: row.seat_id as number,
    seatCode: `${row.row_label}-${row.col_no}`,
    row: row.row_label as string,
    col: row.col_no as number,
    seatNo: row.col_no as number,
    displayLabel: null,
    sectionCode: null,
    seatType: 'standard',
    leftPct: Number(row.position_left_pct),
    topPct: Number(row.position_top_pct),
    widthPct: visualSizePct,
    heightPct: visualSizePct,
    rotationDeg: 0,
    positionTopPct: Number(row.position_top_pct),
    positionLeftPct: Number(row.position_left_pct),
    seatWidthPct: visualSizePct,
    seatHeightPct: visualSizePct,
    hitRadiusPct: row.hit_radius_pct != null ? Number(row.hit_radius_pct) : null,
    status: row.status as 'available' | 'reserved' | 'held',
  }
}

function normalizeSeatVisualSize(widthPct: number, heightPct: number): number {
  if (widthPct <= 0 && heightPct <= 0) return 3
  if (widthPct <= 0) return heightPct
  if (heightPct <= 0) return widthPct

  return Math.min(widthPct, heightPct)
}

export function defaultLayoutObjects(): LayoutObjectInfo[] {
  return [
    {
      id: 0,
      type: 'screen',
      code: 'main-screen',
      label: 'SCREEN',
      leftPct: 12,
      topPct: 4,
      widthPct: 76,
      heightPct: 4,
      rotationDeg: 0,
      zIndex: 1,
      style: {},
    },
    {
      id: 0,
      type: 'entrance',
      code: 'main-entrance',
      label: 'ENTRANCE',
      leftPct: 36,
      topPct: 91,
      widthPct: 28,
      heightPct: 5,
      rotationDeg: 0,
      zIndex: 1,
      style: {},
    },
  ]
}
