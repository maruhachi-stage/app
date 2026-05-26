import { useState, useEffect } from "react"
import { useParams, useSearchParams, useNavigate } from "react-router"
import { apiFetch, ApiError } from "~/shared/api/client"
import { getNext7Days } from "~/shared/lib/date"
import type { Movie, Schedule } from "~/entities/movie/types"

export interface UseSchedulesOptions {
  category?: "movie" | "stage"
  idParamName?: string
}

export function useSchedules(options?: UseSchedulesOptions) {
  const params = useParams<Record<string, string>>()
  const idParamName = options?.idParamName ?? "movieId"
  const movieId = params[idParamName]
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedDate = searchParams.get("date") ?? ""
  const category = options?.category ?? (searchParams.get("category") ?? "")
  const navigate = useNavigate()

  const [data, setData] = useState<{ movie: Movie; schedules: Schedule[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const days = getNext7Days()

  useEffect(() => {
    if (!movieId) return
    setLoading(true)
    setError("")
    
    // カテゴリが stage の場合は /stages を叩く
    const baseEndpoint = category === "stage" ? `/stages/${movieId}` : `/movies/${movieId}`
    const qs = selectedDate ? `?date=${selectedDate}` : ""
    
    apiFetch<{ movie: Movie; schedules: Schedule[] }>(`${baseEndpoint}/schedules${qs}`)
      .then(d => {
        setData({
          ...d,
          movie: {
            ...d.movie,
            type: category === "stage" ? "stage" : "movie"
          }
        })
      })
      .catch(err => {
        if (err instanceof ApiError && err.status === 404) {
          navigate(category === "stage" ? "/stages" : "/movies", { replace: true })
        } else {
          setError("読み込みに失敗しました")
        }
      })
      .finally(() => setLoading(false))
  }, [movieId, selectedDate, category])

  function setDate(date: string) {
    setSearchParams(p => {
      const n = new URLSearchParams(p)
      if (date) n.set("date", date); else n.delete("date")
      return n
    }, { preventScrollReset: true })
  }

  function selectSchedule(scheduleId: number) {
    const categoryQs = category === "stage" ? "&category=stage" : ""
    navigate(`/reservations/booking/${movieId}?date=${selectedDate}&scheduleId=${scheduleId}${categoryQs}`)
  }

  return { data, loading, error, days, selectedDate, setDate, selectSchedule }
}
