import { useCallback, useEffect, useState } from "react"
import { getOverview } from "~/features/dashboard/api/get-overview"
import type { StaffOverview } from "~/types/staff"

export function useDashboard() {
  const [overview, setOverview] = useState<StaffOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const reload = useCallback(async () => {
    setLoading(true)
    setError("")
    try { setOverview(await getOverview()) } catch (cause) { setError(cause instanceof Error ? cause.message : "ダッシュボードの読み込みに失敗しました") } finally { setLoading(false) }
  }, [])
  useEffect(() => { void reload() }, [reload])
  return { overview, loading, error, reload }
}
