// Application: ホーム画面のデータ取得
import { useState, useEffect } from "react"
import { apiFetch, ApiError } from "~/lib/api-client"
import { proxyImageUrl } from "~/lib/image"
import { todayJst } from "~/lib/date"
import type { Screening as Movie } from "~/features/screening/domain/screening"

export function useHomeScreenings() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [todayScreenings, setTodayScreenings] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const todayStr = todayJst()

  useEffect(() => {
    const fetchAll = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1500))

        const moviesData = await apiFetch<{ items: Movie[] }>("/movies")

        const imageUrls = moviesData.items
          .map(movie => proxyImageUrl(movie.thumbnailUrl))
          .filter(Boolean) as string[]

        await Promise.all(
          imageUrls.map(
            (url) =>
              new Promise<void>((resolve) => {
                const img = new Image()
                img.src = url
                img.onload = () => resolve()
                img.onerror = () => resolve()
              })
          )
        )

        setMovies(moviesData.items)

        const todayData = await apiFetch<{ items: Movie[] }>(`/movies?date=${todayStr}`)
        setTodayScreenings(
          todayData.items.map((movie) => ({ ...movie, type: "movie" as const }))
        )
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "読み込みに失敗しました")
      } finally {
        console.log("finish!")
        setLoading(false)
      }
    }

    fetchAll()
  }, [todayStr])

  const hasTodaySchedules = todayScreenings.some((screening) => screening.schedules && screening.schedules.length > 0)

  return { movies, todayScreenings, loading, error, todayStr, hasTodaySchedules }
}
