import {useMovies} from "~/features/movie/useMovies"
import {DateSelector} from "~/widgets/DateSelector"
import {MovieFilters} from "~/features/movie/components/MovieFilters"
import {MovieGrid} from "~/features/movie/components/MovieGrid"

export default function StagesPage() {
    const {
        movies,
        loading,
        error,
        days,
        selectedDate,
        selectedStatus,
        sortBy,
        view,
        setDate,
        setStatus,
        setSort,
        setView,
        clearAll,
    } = useMovies({ category: "stage" })

    return (
        <div className="py-8">
            <DateSelector 
                days={days} 
                selectedDate={selectedDate} 
                onSelect={setDate} 
            />

            <MovieFilters 
                selectedStatus={selectedStatus} 
                selectedDate={selectedDate}
                sortBy={sortBy}
                view={view}
                onStatusChange={setStatus} 
                onSortChange={setSort}
                onViewChange={setView}
                onClearAll={clearAll}
            />

            <MovieGrid 
                movies={movies} 
                selectedDate={selectedDate} 
                loading={loading} 
                view={view}
                error={error} 
            />
        </div>
    )
}
