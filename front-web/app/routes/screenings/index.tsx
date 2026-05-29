import { useScreenings } from "~/features/screening/useScreenings"
import { DateSelector } from "~/widgets/DateSelector"
import { ScreeningFilters } from "~/features/screening/components/ScreeningFilters"
import { ScreeningGrid } from "~/features/screening/components/ScreeningGrid"

export default function ScreeningsPage() {
  const {
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
  } = useScreenings()

  return (
    <div className="py-8">
      <DateSelector days={days} selectedDate={selectedDate} onSelect={setDate} />

      <ScreeningFilters
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
        <ScreeningGrid screenings={screenings} selectedDate={selectedDate} loading={loading} view={view} error={error} />
      )}
    </div>
  )
}
