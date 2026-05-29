import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "react-router"
import { apiFetch } from "~/shared/api/client"
import { getNext7Days } from "~/shared/lib/date"
import type { Movie, Schedule, ScreeningType } from "~/entities/movie/types"

type ScheduleInfo = {
  scheduleId: number
  startsAt: string
  type: ScreeningType
}

export function useScheduleSelection() {
  const { movieId } = useParams<{ movieId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const [movie, setMovie] = useState<Movie | null>(null)
  const [schedules, setSchedules] = useState<Schedule[]>([])

  const selectedDate = searchParams.get("date") ?? ""
  const selectedScheduleId = searchParams.get("scheduleId") ? Number(searchParams.get("scheduleId")) : null
  const selectedType = (searchParams.get("type") ?? "movie") as ScreeningType

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [reloadKey, setReloadKey] = useState(0)

  const days = getNext7Days()

  useEffect(() => {
    if (!movieId) return

    if (selectedType === "event") {
      setMovie(null)
      setSchedules([])
      setLoading(false)
      setError("イベント上映は準備中です。")
      return
    }

    setLoading(true)
    const endpoint = selectedType === "stage" ? `/stages/${movieId}` : `/movies/${movieId}`

    apiFetch<Movie>(endpoint)
      .then((m) => setMovie({ ...m, type: selectedType }))
      .catch(() => setError("作品情報が見つかりません"))
      .finally(() => setLoading(false))
  }, [movieId, selectedType, reloadKey])

  useEffect(() => {
    if (!selectedDate && selectedScheduleId) {
      apiFetch<ScheduleInfo>(`/schedules/${selectedScheduleId}`).then((sch) => {
        const date = new Date(sch.startsAt).toLocaleDateString("sv", { timeZone: "Asia/Tokyo" })
        setSearchParams((prev) => {
          const p = new URLSearchParams(prev)
          p.set("date", date)
          p.set("type", sch.type)
          return p
        }, { replace: true })
      })
    }
  }, [selectedDate, selectedScheduleId, setSearchParams, reloadKey])

  useEffect(() => {
    if (!movieId || !selectedDate) {
      setSchedules([])
      setError("")
      return
    }

    if (selectedType === "event") {
      setSchedules([])
      setError("イベント上映は準備中です。")
      return
    }

    setSchedules([])
    setError("")
    const endpoint = selectedType === "stage" ? `/stages/${movieId}/schedules?date=${selectedDate}` : `/movies/${movieId}/schedules?date=${selectedDate}`

    apiFetch<{ schedules: Schedule[] }>(endpoint)
      .then((d) => {
        setSchedules(d.schedules)
      })
      .catch(() => {
        setSchedules([])
        setError("上映スケジュールの取得に失敗しました")
      })
  }, [movieId, selectedDate, selectedType, reloadKey])

  function retryLoadSchedules() {
    setReloadKey((prev) => prev + 1)
  }

  function setSelectedDate(date: string) {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev)
      if (date) p.set("date", date)
      else p.delete("date")
      p.delete("scheduleId")
      return p
    })
  }

  function setSelectedScheduleId(id: number | null) {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev)
      if (id) p.set("scheduleId", String(id))
      else p.delete("scheduleId")
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
