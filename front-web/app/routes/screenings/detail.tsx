import { Link, useParams } from "react-router"
import { useEffect, useState } from "react"
import { useSchedules } from "~/features/movie/useSchedules"
import { apiFetch } from "~/shared/api/client"
import type { Movie } from "~/entities/movie/types"
import { DateSelector } from "~/widgets/DateSelector"
import { ScheduleGrid } from "~/widgets/ScheduleGrid"
import { MovieGridCard } from "~/widgets/MovieCard"

export default function ScreeningDetailPage() {
  const { movieId } = useParams<{ movieId: string }>()
  const { data, loading, error, days, selectedDate, setDate, selectedType } = useSchedules({ idParamName: "movieId" })
  const [relatedItems, setRelatedItems] = useState<Movie[]>([])

  useEffect(() => {
    if (!movieId || selectedType === "event") return

    const endpoint = selectedType === "stage" ? "/stages" : "/movies"
    apiFetch<{ items: Movie[] }>(endpoint)
      .then((res) => {
        setRelatedItems(
          res.items.filter((item) => item.id !== Number(movieId)).map((item) => ({ ...item, type: selectedType })),
        )
      })
      .catch(() => {
        setRelatedItems([])
      })
  }, [movieId, selectedType])

  return (
    <div className="py-8">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link to={`/screenings?type=${selectedType}${selectedDate ? `&date=${selectedDate}` : ""}`} className="hover:text-foreground">
          Screenings
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{data?.movie.title ?? "Detail"}</span>
      </nav>

      {loading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-primary">{error}</p>}

      {data && (
        <>
          <section className="rounded-app border border-border bg-card p-6">
            <h1 className="text-3xl font-black text-foreground">{data.movie.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{data.movie.durationMin} min</p>
            <p className="mt-4 whitespace-pre-wrap leading-relaxed text-muted-foreground">{data.movie.description}</p>
            {selectedType === "stage" && (
              <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                <p>Playwright: {data.movie.playwright ?? "-"}</p>
                <p>Director: {data.movie.director ?? "-"}</p>
              </div>
            )}
          </section>

          <section className="mt-10 border-t border-border pt-8">
            <h2 className="mb-4 text-xl font-bold text-foreground">Schedules</h2>
            <DateSelector days={days} selectedDate={selectedDate} onSelect={setDate} />
            <div className="mt-4">
              <ScheduleGrid schedules={data.schedules} movieId={data.movie.id} selectedDate={selectedDate} movieType={selectedType} />
            </div>
          </section>

          {relatedItems.length > 0 && (
            <section className="mt-10 border-t border-border pt-8">
              <h2 className="mb-4 text-xl font-bold text-foreground">Related</h2>
              <div className="-mx-4 overflow-x-auto px-4">
                <div className="flex gap-4 pb-4">
                  {relatedItems.map((item) => (
                    <div key={item.id} className="w-36 shrink-0 md:w-44">
                      <MovieGridCard movie={item} selectedDate={selectedDate} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
