import { useCallback, useEffect, useState } from "react"
import { getOverview } from "~/features/dashboard/api/get-overview"
import type { AdminOverview } from "~/types/admin"

export function useDashboard(editKey: string) {
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const reload = useCallback(async () => {
    setLoading(true)
    setError("")
    try { setOverview(await getOverview(editKey)) } catch (cause) { setError(cause instanceof Error ? cause.message : "管理概要の読み込みに失敗しました") } finally { setLoading(false) }
  }, [editKey])
  useEffect(() => { void reload() }, [reload])
  return { overview, loading, error, reload }
}
