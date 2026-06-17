import { useCallback, useEffect, useState } from "react"
import { apiFetch } from "~/shared/api/client"

export type SeatStatus = "available" | "reserved" | "held"
export type SeatType = "standard" | "premium" | "wheelchair_companion" | "unavailable"

export type LayoutObjectData = {
  id: number
  type: "screen" | "aisle" | "entrance" | "label" | "divider" | "stairs" | "wheelchair_space" | "background_zone"
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

const SEAT_STATUS_POLL_MS = 15_000

export function useSeatMap(selectedScheduleId: number | null) {
  const [mapData, setMapData] = useState<SeatMapData | null>(null)
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([])
  const [mapLoading, setMapLoading] = useState(false)
  const [error, setError] = useState("")
  const [toastMsg, setToastMsg] = useState("")
  const [reloadKey, setReloadKey] = useState(0)

  const loadSeatMap = useCallback((showLoading = true) => {
    if (!selectedScheduleId) {
      setMapData(null)
      setSelectedSeatIds([])
      setError("")
      return
    }

    if (showLoading) setMapLoading(true)
    setError("")
    apiFetch<SeatMapData>(`/reservations/schedules/${selectedScheduleId}/seats`)
      .then(data => {
        setMapData(data)
        setSelectedSeatIds(prev => {
          const selectableIds = new Set(data.seats.filter(seat => seat.status === "available").map(seat => seat.seatId))
          return prev.filter(id => selectableIds.has(id))
        })
        setError("")
      })
      .catch(() => {
        if (showLoading) {
          setMapData(null)
          setSelectedSeatIds([])
        }
        setError("座席情報の取得に失敗しました")
      })
      .finally(() => {
        if (showLoading) setMapLoading(false)
      })
  }, [selectedScheduleId])

  useEffect(() => {
    loadSeatMap(true)
  }, [loadSeatMap, reloadKey])

  useEffect(() => {
    if (!selectedScheduleId) return
    const timer = window.setInterval(() => loadSeatMap(false), SEAT_STATUS_POLL_MS)
    return () => window.clearInterval(timer)
  }, [loadSeatMap, selectedScheduleId])

  function retryLoadSeatMap() {
    setReloadKey(prev => prev + 1)
  }

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(""), 2500)
  }

  function toggleSeat(seat: SeatData) {
    if (seat.status !== "available") return
    if (selectedSeatIds.includes(seat.seatId)) {
      setSelectedSeatIds(prev => prev.filter(id => id !== seat.seatId))
    } else {
      if (selectedSeatIds.length >= 8) {
        showToast("最大8席まで選択できます。")
        return
      }
      setSelectedSeatIds(prev => [...prev, seat.seatId])
    }
  }

  return {
    mapData,
    mapLoading,
    selectedSeatIds,
    toggleSeat,
    error,
    toastMsg,
    showToast,
    retryLoadSeatMap,
  }
}
