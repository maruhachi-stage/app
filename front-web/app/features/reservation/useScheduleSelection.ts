import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "react-router"
import { apiFetch } from "~/lib/api-client"
import { getNext7Days } from "~/lib/date"
import type { Screening, Schedule, ScreeningType } from "~/features/screening/domain/screening"

type ScheduleInfo = {
  scheduleId: number
  startsAt: string
  type: ScreeningType
}

export function useScheduleSelection() {
  const { movieId } = useParams<{ movieId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const [screening, setScreening] = useState<Screening | null>(null)
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

    setLoading(true)
    const endpoint = selectedType === "stage" || selectedType === "event" ? `/stages/${movieId}` : `/movies/${movieId}`

    apiFetch<Screening>(endpoint)
      .then((m) => setScreening({ ...m, type: selectedType }))
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

  // スケジュールを取得（日付未選択時は全件）
  useEffect(() => {
    if (!movieId) {
      setSchedules([])
      setError("")
      return
    }

    setSchedules([])
    setError("")
    const endpoint = selectedType === "stage" || selectedType === "event" ? `/stages/${movieId}/schedules?date=${selectedDate}` : `/movies/${movieId}/schedules?date=${selectedDate}`

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
    movie: screening,  // booking.tsx との後方互換のため movie として公開
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
