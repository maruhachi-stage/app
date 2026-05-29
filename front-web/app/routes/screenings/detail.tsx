import { Link, useParams } from "react-router"
import { useEffect, useState } from "react"
import { useSchedules } from "~/features/screening/useSchedules"
import { apiFetch } from "~/shared/api/client"
import type { Screening } from "~/entities/screening/types"
import { DateSelector } from "~/widgets/DateSelector"
import { ScheduleGrid } from "~/widgets/ScheduleGrid"
import { ScreeningGridCard } from "~/widgets/ScreeningCard"

export default function ScreeningDetailPage() {
  const { movieId } = useParams<{ movieId: string }>()
  const { data, loading, error, days, selectedDate, setDate, selectedType } = useSchedules({ idParamName: "movieId" })
  const [relatedItems, setRelatedItems] = useState<Screening[]>([])

  useEffect(() => {
    if (!movieId || selectedType === "event") return

    const endpoint = selectedType === "stage" ? "/stages" : "/movies"
    apiFetch<{ items: Screening[] }>(endpoint)
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
          上映一覧
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{data?.item.title ?? "詳細"}</span>
      </nav>

      {loading && <p className="text-muted-foreground">読み込み中...</p>}
      {error && <p className="text-primary">{error}</p>}

      {data && (
        <>
          <section className="rounded-app border border-border bg-card p-6">
            <h1 className="text-3xl font-black text-foreground">{data.item.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{data.item.durationMin}分</p>
            <p className="mt-4 whitespace-pre-wrap leading-relaxed text-muted-foreground">{data.item.description}</p>
            {selectedType === "stage" && (
              <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                <p>脚本：{data.item.playwright ?? "—"}</p>
                <p>演出：{data.item.director ?? "—"}</p>
              </div>
            )}
          </section>

          <section className="mt-10 border-t border-border pt-8">
            <h2 className="mb-4 text-xl font-bold text-foreground">上映スケジュール</h2>
            <DateSelector days={days} selectedDate={selectedDate} onSelect={setDate} />
            <div className="mt-4">
              <ScheduleGrid schedules={data.schedules} itemId={data.item.id} selectedDate={selectedDate} screeningType={selectedType} />
            </div>
          </section>

          {relatedItems.length > 0 && (
            <section className="mt-10 border-t border-border pt-8">
              <h2 className="mb-4 text-xl font-bold text-foreground">関連作品</h2>
              <div className="-mx-4 overflow-x-auto px-4">
                <div className="flex gap-4 pb-4">
                  {relatedItems.map((item) => (
                    <div key={item.id} className="w-36 shrink-0 md:w-44">
                      <ScreeningGridCard screening={item} selectedDate={selectedDate} />
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
