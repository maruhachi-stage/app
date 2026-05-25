import { useState, useEffect } from "react"
import { useParams, useSearchParams, useNavigate } from "react-router"
import { apiFetch, ApiError } from "~/shared/api/client"
import { getNext7Days } from "~/shared/lib/date"
import type { Movie, Schedule } from "~/entities/movie/types"

export function useSchedules() {
  const { movieId } = useParams<{ movieId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedDate = searchParams.get("date") ?? ""
  const navigate = useNavigate()

  const [data, setData] = useState<{ movie: Movie; schedules: Schedule[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const days = getNext7Days()

  useEffect(() => {
    if (!movieId) return
    setLoading(true)
    setError("")
    const qs = selectedDate ? `?date=${selectedDate}` : ""
    apiFetch<{ movie: Movie; schedules: Schedule[] }>(`/movies/${movieId}/schedules${qs}`)
      .then(setData)
      .catch(err => {
        if (err instanceof ApiError && err.status === 404) navigate("/movies", { replace: true })
        else setError("読み込みに失敗しました")
      })
      .finally(() => setLoading(false))
  }, [movieId, selectedDate])

  function setDate(date: string) {
    setSearchParams(p => {
      const n = new URLSearchParams(p)
      if (date) n.set("date", date); else n.delete("date")
      return n
    }, { preventScrollReset: true })
  }

  function selectSchedule(scheduleId: number) {
    navigate(`/reservations/booking/${movieId}?date=${selectedDate}&scheduleId=${scheduleId}`)
  }

  return { data, loading, error, days, selectedDate, setDate, selectSchedule }
}
