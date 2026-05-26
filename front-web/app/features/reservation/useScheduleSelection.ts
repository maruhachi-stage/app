import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "react-router"
import { apiFetch } from "~/shared/api/client"
import { getNext7Days } from "~/shared/lib/date"
import type { Movie, Schedule } from "~/entities/movie/types"

export function useScheduleSelection() {
  const { movieId } = useParams<{ movieId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const [movie, setMovie] = useState<Movie | null>(null)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  
  const selectedDate = searchParams.get("date") ?? ""
  const selectedScheduleId = searchParams.get("scheduleId") ? Number(searchParams.get("scheduleId")) : null
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [reloadKey, setReloadKey] = useState(0)

  const days = getNext7Days()

  // 初期読み込み: 映画情報
  useEffect(() => {
    if (!movieId) return
    setLoading(true)
    apiFetch<Movie>(`/movies/${movieId}`)
      .then(setMovie)
      .catch(() => setError("映画情報が見つかりません"))
      .finally(() => setLoading(false))
  }, [movieId, reloadKey])

  // 日付が空だがスケジュールIDがある場合、スケジュール情報から日付を補完する
  useEffect(() => {
    if (!selectedDate && selectedScheduleId) {
      apiFetch<Schedule & { startsAt: string }>(`/schedules/${selectedScheduleId}`)
        .then(sch => {
          // JSTでの日付文字列 (YYYY-MM-DD) を取得
          const date = new Date(sch.startsAt).toLocaleDateString("sv", { timeZone: "Asia/Tokyo" })
          setSearchParams(prev => {
            const p = new URLSearchParams(prev)
            p.set("date", date)
            return p
          }, { replace: true })
        })
    }
  }, [selectedDate, selectedScheduleId, setSearchParams, reloadKey])

  // スケジュールを取得（日付未選択時は全件）
  useEffect(() => {
    if (!movieId) {
      setSchedules([])
      setError("")
      return
    }
    setSchedules([])
    setError("")
    const qs = selectedDate ? `?date=${selectedDate}` : ""
    apiFetch<{ schedules: Schedule[] }>(`/movies/${movieId}/schedules${qs}`)
      .then(d => {
        setSchedules(d.schedules)
      })
      .catch(() => {
        setSchedules([])
        setError("上映スケジュールの取得に失敗しました")
      })
  }, [movieId, selectedDate, reloadKey])

  function retryLoadSchedules() {
    setReloadKey(prev => prev + 1)
  }

  function setSelectedDate(date: string) {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev)
      if (date) p.set("date", date); else p.delete("date")
      p.delete("scheduleId") // 日付が変わったらスケジュール選択もリセット
      return p
    })
  }

  function setSelectedScheduleId(id: number | null) {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev)
      if (id) p.set("scheduleId", String(id)); else p.delete("scheduleId")
      return p
    })
  }

  return {
    movie,
    days,
    selectedDate,
    setSelectedDate,
    schedules,
    selectedScheduleId,
    setSelectedScheduleId,
    loading,
    error,
    retryLoadSchedules,
  }
}
