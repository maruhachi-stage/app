import { useScreenings } from "~/features/screening/useScreenings"
import { DateSelector } from "~/components/DateSelector"
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
  } = useScreenings()

  return (
    <div className="py-8">
      <DateSelector days={days} selectedDate={selectedDate} onSelect={setDate} />

      <ScreeningFilters
        selectedType={selectedType}
        selectedStatus={selectedStatus}
        sortBy={sortBy}
        view={view}
        onTypeChange={setType}
        onStatusChange={setStatus}
        onSortChange={setSort}
        onViewChange={setView}
      />

      <ScreeningGrid screenings={screenings} selectedDate={selectedDate} loading={loading} view={view} error={error} />
    </div>
  )
}
