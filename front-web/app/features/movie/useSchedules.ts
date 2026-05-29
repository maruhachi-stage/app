import { useState, useEffect } from "react"
import { useParams, useSearchParams, useNavigate } from "react-router"
import { apiFetch, ApiError } from "~/shared/api/client"
import { getNext7Days } from "~/shared/lib/date"
import type { Movie, Schedule, ScreeningType } from "~/entities/movie/types"

export interface UseSchedulesOptions {
  type?: ScreeningType
  category?: "movie" | "stage"
  idParamName?: string
}

type ScheduleResponse = {
  movie?: Movie
  stage?: Movie
  schedules: Schedule[]
}

export function useSchedules(options?: UseSchedulesOptions) {
  const params = useParams<Record<string, string>>()
  const idParamName = options?.idParamName ?? "movieId"
  const movieId = params[idParamName]
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedDate = searchParams.get("date") ?? ""
  const selectedType =
    options?.type ??
    options?.category ??
    ((searchParams.get("type") ?? searchParams.get("category") ?? "movie") as ScreeningType)
  const navigate = useNavigate()

  const [data, setData] = useState<{ movie: Movie; schedules: Schedule[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const days = getNext7Days()

  useEffect(() => {
    if (!movieId) return

    if (selectedType === "event") {
      setData(null)
      setLoading(false)
      setError("イベント上映は準備中です。")
      return
    }

    setLoading(true)
    setError("")

    const baseEndpoint = selectedType === "stage" ? `/stages/${movieId}` : `/movies/${movieId}`
    const qs = selectedDate ? `?date=${selectedDate}` : ""

    apiFetch<ScheduleResponse>(`${baseEndpoint}/schedules${qs}`)
      .then((d) => {
        const baseMovie = (d.movie ?? d.stage) as Movie | undefined
        if (!baseMovie) {
          setError("データ形式が不正です。")
          return
        }

        setData({
          movie: {
            ...baseMovie,
            type: selectedType,
          },
          schedules: d.schedules,
        })
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          navigate(`/screenings?type=${selectedType}`, { replace: true })
        } else {
          setError("隱ｭ縺ｿ霎ｼ縺ｿ縺ｫ螟ｱ謨励＠縺ｾ縺励◆")
        }
      })
      .finally(() => setLoading(false))
  }, [movieId, selectedDate, selectedType, navigate])

  function setDate(date: string) {
    setSearchParams(
      (p) => {
        const n = new URLSearchParams(p)
        if (date) n.set("date", date)
        else n.delete("date")
        return n
      },
      { preventScrollReset: true },
    )
  }

  function selectSchedule(scheduleId: number) {
    navigate(`/reservations/booking/${movieId}?date=${selectedDate}&scheduleId=${scheduleId}&type=${selectedType}`)
  }

  return { data, loading, error, days, selectedDate, setDate, selectSchedule, selectedType }
}
