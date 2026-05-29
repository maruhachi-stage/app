import { useMovies } from "~/features/movie/useMovies"
import { DateSelector } from "~/widgets/DateSelector"
import { MovieFilters } from "~/features/movie/components/MovieFilters"
import { MovieGrid } from "~/features/movie/components/MovieGrid"

export default function ScreeningsPage() {
  const {
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
  } = useMovies()

  return (
    <div className="py-8">
      <DateSelector days={days} selectedDate={selectedDate} onSelect={setDate} />

      <MovieFilters
        selectedType={selectedType}
        selectedStatus={selectedStatus}
        selectedDate={selectedDate}
        sortBy={sortBy}
        view={view}
        onTypeChange={setType}
        onStatusChange={setStatus}
        onSortChange={setSort}
        onViewChange={setView}
        onClearAll={clearAll}
      />

      {selectedType === "event" ? (
        <div className="rounded-app border border-border bg-card p-8 text-center text-muted-foreground">
          イベント上映は準備中です。
        </div>
      ) : (
        <MovieGrid movies={movies} selectedDate={selectedDate} loading={loading} view={view} error={error} />
      )}
    </div>
  )
}
