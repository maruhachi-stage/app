import { useState, useEffect } from "react"
import { useParams, useSearchParams, useNavigate } from "react-router"
import { apiFetch, ApiError } from "~/lib/api-client"
import { getNext7Days } from "~/lib/date"
import type { Screening, Schedule, ScreeningType } from "~/features/screening/domain/screening"

export interface UseSchedulesOptions {
  type?: ScreeningType
  category?: "movie" | "stage"
  idParamName?: string
}

type ScheduleResponse = {
  movie?: Screening
  stage?: Screening
  schedules: Schedule[]
}

export function useSchedules(options?: UseSchedulesOptions) {
  const params = useParams<Record<string, string>>()
  const idParamName = options?.idParamName ?? "itemId"
  const itemId = params[idParamName]
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedDate = searchParams.get("date") ?? ""
  const selectedType =
    options?.type ??
    options?.category ??
    ((searchParams.get("type") ?? searchParams.get("category") ?? "movie") as ScreeningType)
  const navigate = useNavigate()

  const [data, setData] = useState<{ item: Screening; schedules: Schedule[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const days = getNext7Days()

  useEffect(() => {
    if (!itemId) return

    setLoading(true)
    setError("")

    const baseEndpoint = selectedType === "stage" || selectedType === "event" ? `/stages/${itemId}` : `/movies/${itemId}`
    const qs = selectedDate ? `?date=${selectedDate}` : ""

    apiFetch<ScheduleResponse>(`${baseEndpoint}/schedules${qs}`)
      .then((d) => {
        const baseItem = (d.movie ?? d.stage) as Screening | undefined
        if (!baseItem) {
          setError("データ形式が不正です。")
          return
        }

        setData({
          item: {
            ...baseItem,
            type: selectedType,
          },
          schedules: d.schedules,
        })
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          navigate(`/screenings?type=${selectedType}`, { replace: true })
        } else {
          setError("読み込みに失敗しました")
        }
      })
      .finally(() => setLoading(false))
  }, [itemId, selectedDate, selectedType, navigate])

  function setDate(date: string) {
    setSearchParams(
      (p) => {
        const n = new URLSearchParams(p)
        if (date && date !== selectedDate) n.set("date", date)
        else n.delete("date")
        return n
      },
      { preventScrollReset: true },
    )
  }

  function selectSchedule(scheduleId: number) {
    navigate(`/reservations/booking/${itemId}?date=${selectedDate}&scheduleId=${scheduleId}&type=${selectedType}`)
  }

  return { data, loading, error, days, selectedDate, setDate, selectSchedule, selectedType }
}
