import { useState, useEffect } from "react"
import { useSearchParams } from "react-router"
import { apiFetch, ApiError } from "~/shared/api/client"
import { getNext7Days } from "~/shared/lib/date"
import type { Screening, ScreeningType } from "~/entities/screening/types"

export interface UseScreeningsOptions {
  type?: ScreeningType | "all"
  category?: "movie" | "stage"
}

export function useScreenings(options?: UseScreeningsOptions) {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedDate = searchParams.get("date") ?? ""
  const selectedStatus = (searchParams.get("status") ?? "") as "" | "now_showing" | "coming_soon"
  const sortBy = (searchParams.get("sort") ?? "newest") as "newest" | "title" | "duration"
  const view = (searchParams.get("view") ?? "grid") as "grid" | "list" | "timetable"
  const selectedType = options?.type ?? options?.category ?? ((searchParams.get("type") ?? "all") as ScreeningType | "all")

  const [screenings, setScreenings] = useState<Screening[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const days = getNext7Days()

  useEffect(() => {
    setLoading(true)
    setError("")
    const params = new URLSearchParams()
    if (selectedDate) params.set("date", selectedDate)
    if (selectedStatus) params.set("status", selectedStatus)
    const qs = params.toString()

    let fetchPromise: Promise<{ items: Screening[] }>
    if (selectedType === "all") {
      fetchPromise = Promise.all([
        apiFetch<{ items: Screening[] }>(`/movies${qs ? `?${qs}` : ""}`)
          .then((d) => d.items.map((item) => ({ ...item, type: "movie" as const }))),
        apiFetch<{ items: Screening[] }>(`/stages${qs ? `?${qs}` : ""}`)
          .then((d) => d.items.map((item) => ({ ...item, type: item.type ?? ("stage" as const) })))
      ]).then(([movies, stages]) => ({
        items: [...movies, ...stages]
      }))
    } else {
      const endpoint = selectedType === "stage" || selectedType === "event" ? "/stages" : "/movies"
      const typeQs = selectedType === "stage" || selectedType === "event" ? `type=${selectedType}` : ""
      const fullQs = [qs, typeQs].filter(Boolean).join("&")
      fetchPromise = apiFetch<{ items: Screening[] }>(`${endpoint}${fullQs ? `?${fullQs}` : ""}`)
        .then((d) => ({
          items: d.items.map((item) => ({ ...item, type: selectedType }))
        }))
    }

    fetchPromise
      .then((d) => {
        let sorted = [...d.items]

        if (sortBy === "title") {
          sorted.sort((a, b) => a.title.localeCompare(b.title, "ja"))
        } else if (sortBy === "duration") {
          sorted.sort((a, b) => b.durationMin - a.durationMin)
        }

        setScreenings(sorted)
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

  function setType(type: ScreeningType | "all") {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev)
      if (type === "all") {
        p.delete("type")
      } else {
        p.set("type", type)
      }
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
    screenings,
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
