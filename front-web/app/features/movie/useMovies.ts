import { useState, useEffect } from "react"
import { useSearchParams } from "react-router"
import { apiFetch, ApiError } from "~/shared/api/client"
import { getNext7Days } from "~/shared/lib/date"
import type { Movie, ScreeningType } from "~/entities/movie/types"

export interface UseMoviesOptions {
  type?: ScreeningType
  category?: "movie" | "stage"
}

export function useMovies(options?: UseMoviesOptions) {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedDate = searchParams.get("date") ?? ""
  const selectedStatus = (searchParams.get("status") ?? "") as "" | "now_showing" | "coming_soon"
  const sortBy = (searchParams.get("sort") ?? "newest") as "newest" | "title" | "duration"
  const view = (searchParams.get("view") ?? "grid") as "grid" | "list" | "timetable"
  const selectedType = options?.type ?? options?.category ?? ((searchParams.get("type") ?? "movie") as ScreeningType)

  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const days = getNext7Days()

  useEffect(() => {
    if (selectedType === "event") {
      setMovies([])
      setLoading(false)
      setError("")
      return
    }

    setLoading(true)
    setError("")
    const params = new URLSearchParams()
    if (selectedDate) params.set("date", selectedDate)
    if (selectedStatus) params.set("status", selectedStatus)
    const qs = params.toString()

    const endpoint = selectedType === "stage" ? "/stages" : "/movies"

    apiFetch<{ items: Movie[] }>(`${endpoint}${qs ? `?${qs}` : ""}`)
      .then((d) => {
        let sorted = d.items.map((item) => ({
          ...item,
          type: selectedType,
        }))

        if (sortBy === "title") {
          sorted.sort((a, b) => a.title.localeCompare(b.title, "ja"))
        } else if (sortBy === "duration") {
          sorted.sort((a, b) => b.durationMin - a.durationMin)
        }

        setMovies(sorted)
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "読み込みに失敗しました"))
      .finally(() => setLoading(false))
  }, [selectedDate, selectedStatus, sortBy, selectedType])

  function setDate(date: string) {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev)
      if (date) p.set("date", date)
      else p.delete("date")
      return p
    }, { preventScrollReset: true })
  }

  function setStatus(status: string) {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev)
      if (status) p.set("status", status)
      else p.delete("status")
      return p
    }, { preventScrollReset: true })
  }

  function setSort(sort: string) {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev)
      if (sort && sort !== "newest") p.set("sort", sort)
      else p.delete("sort")
      return p
    }, { preventScrollReset: true })
  }

  function setView(v: "grid" | "list" | "timetable") {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev)
      if (v === "grid") p.delete("view")
      else p.set("view", v)
      return p
    }, { preventScrollReset: true })
  }

  function setType(type: ScreeningType) {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev)
      p.set("type", type)
      p.delete("status")
      return p
    }, { preventScrollReset: true })
  }

  function clearAll() {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev)
      p.delete("date")
      p.delete("status")
      return p
    }, { preventScrollReset: true })
  }

  return {
    movies,
    loading,
    error,
    days,
    selectedDate,
    selectedStatus,
    sortBy,
    view,
    selectedType,
    setDate,
    setStatus,
    setSort,
    setView,
    setType,
    clearAll,
  }
}
