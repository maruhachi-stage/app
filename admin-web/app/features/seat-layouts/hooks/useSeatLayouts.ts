import { useCallback, useEffect, useState } from "react"
import { getSeatLayouts } from "~/features/seat-layouts/api/get-seat-layouts"
import type { StaffScreen } from "~/types/staff"

export function useSeatLayouts() {
  const [screens, setScreens] = useState<StaffScreen[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const reload = useCallback(async () => {
    setLoading(true)
    setError("")
    try { setScreens(await getSeatLayouts()) } catch (cause) { setError(cause instanceof Error ? cause.message : "スクリーンレイアウトの読み込みに失敗しました") } finally { setLoading(false) }
  }, [])
  useEffect(() => { void reload() }, [reload])
  return { screens, loading, error, reload }
}
