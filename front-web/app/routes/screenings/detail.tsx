import { Link, useParams } from "react-router"
import { useEffect, useRef, useState } from "react"
import { useSchedules } from "~/features/screening/useSchedules"
import { useProducts } from "~/features/product/useProducts"
import { apiFetch } from "~/shared/api/client"
import type { Screening, ScreeningType } from "~/entities/screening/types"
import { DateSelector } from "~/widgets/DateSelector"
import { ScheduleGrid } from "~/widgets/ScheduleGrid"
import { ScreeningGridCard } from "~/widgets/ScreeningCard"
import { ProductCard } from "~/widgets/ProductCard"
import { proxyImageUrl } from "~/shared/lib/image"

function extractColor(img: HTMLImageElement): { r: number; g: number; b: number } | null {
  try {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return null

    canvas.width = 50
    canvas.height = 50
    ctx.drawImage(img, 0, 0, 50, 50)

    const { data } = ctx.getImageData(0, 0, 50, 50)
    let r = 0
    let g = 0
    let b = 0
    const count = data.length / 4

    for (let i = 0; i < data.length; i += 4) {
      r += data[i]
      g += data[i + 1]
      b += data[i + 2]
    }

    return {
      r: Math.floor((r / count) * 0.5),
      g: Math.floor((g / count) * 0.5),
      b: Math.floor((b / count) * 0.5),
    }
  } catch {
    return null
  }
}

function getBackLabel(type: ScreeningType): string {
  switch (type) {
    case "stage":
      return "演劇一覧"
    case "event":
      return "イベント一覧"
    default:
      return "映画一覧"
  }
}

function getRelatedLabel(type: ScreeningType): string {
  switch (type) {
    case "stage":
      return "関連演劇"
    case "event":
      return "関連イベント"
    default:
      return "関連映画"
  }
}

function getTypeLabel(type: ScreeningType): string {
  switch (type) {
    case "stage":
      return "STAGE"
    case "event":
      return "EVENT"
    default:
      return "MOVIE"
  }
}

function getStatusLabel(status: Screening["status"]): string {
  return status === "now_showing" ? "上映中" : "公開予定"
}

function getHeroMeta(item: Screening) {
  const meta = [{ label: "上映時間", value: `${item.durationMin}分` }]

  if (item.type === "stage" || item.type === "event") {
    meta.push({ label: "脚本", value: item.playwright?.trim() || "未登録" })
    meta.push({ label: "演出", value: item.director?.trim() || "未登録" })
  }

  return meta
}

export default function ScreeningDetailPage() {
  const { movieId } = useParams<{ movieId: string }>()
  const { data, loading, error, days, selectedDate, setDate, selectedType } = useSchedules({ idParamName: "movieId" })
  const imgRef = useRef<HTMLImageElement>(null)
  const [rgb, setRgb] = useState({ r: 15, g: 15, b: 30 })
  const [relatedItems, setRelatedItems] = useState<Screening[]>([])
  const { products } = useProducts("goods")

  useEffect(() => {
    if (!movieId) return

    const endpoint = selectedType === "stage" || selectedType === "event" ? `/stages?type=${selectedType}` : "/movies"
    apiFetch<{ items: Screening[] }>(endpoint)
      .then((res) => {
        setRelatedItems(
          res.items
            .filter((item) => item.id !== Number(movieId))
            .map((item) => ({ ...item, type: item.type ?? selectedType })),
        )
      })
      .catch(() => {
        setRelatedItems([])
      })
  }, [movieId, selectedType])

  function handleImageLoad() {
    const img = imgRef.current
    if (!img) return

    const color = extractColor(img)
    if (color) setRgb(color)
  }

  const item = data?.item
  const relatedProducts = products
    .filter((product) => !item?.title || !product.movieTitle || product.movieTitle === item.title)
    .slice(0, 8)

  return (
    <div className="pb-16">
      <div
        className="transition-[background] duration-1000"
        style={{
          marginLeft: "calc(50% - 50vw)",
          marginRight: "calc(50% - 50vw)",
          marginTop: "-4rem",
          paddingTop: "4rem",
          background: `linear-gradient(to bottom, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.95) 0%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4) 60%, transparent 100%)`,
        }}
      >
        <div className="container-center pt-8 pb-16">
          <nav className="mb-8 text-sm text-white/60">
            <Link
              to={`/screenings?type=${selectedType}${selectedDate ? `&date=${selectedDate}` : ""}`}
              className="transition-colors hover:text-white"
            >
              {getBackLabel(selectedType)}
            </Link>
            <span className="mx-2 opacity-40">/</span>
            <span className="text-white">{item?.title ?? "詳細"}</span>
          </nav>

          {loading && <p className="text-white/80">読み込み中...</p>}
          {error && <p className="text-red-200">{error}</p>}

          {item && (
            <div className="flex flex-col gap-8 md:flex-row md:items-end">
              <div className="w-44 shrink-0 md:w-52">
                {item.thumbnailUrl ? (
                  <img
                    ref={imgRef}
                    src={proxyImageUrl(item.thumbnailUrl)}
                    alt={item.title}
                    crossOrigin="anonymous"
                    onLoad={handleImageLoad}
                    className="aspect-[2/3] w-full rounded-app object-cover shadow-2xl"
                  />
                ) : (
                  <div className="flex aspect-[2/3] w-full items-center justify-center rounded-app bg-white/10 text-sm font-bold text-white/70 shadow-2xl">
                    NO IMAGE
                  </div>
                )}
              </div>

              <div className="flex-1 pb-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-block rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                      item.status === "now_showing"
                        ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-300"
                        : "border-orange-500/30 bg-orange-500/20 text-orange-300"
                    }`}
                  >
                    {getStatusLabel(item.status)}
                  </span>
                  <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-bold tracking-[0.2em] text-white/80">
                    {getTypeLabel(selectedType)}
                  </span>
                </div>

                <h1 className="mt-4 text-4xl font-black tracking-tighter text-white md:text-5xl lg:text-6xl">
                  {item.title}
                </h1>

                <div className="mt-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm leading-relaxed">
                  {getHeroMeta(item).map((entry) => (
                    <FragmentRow key={entry.label} label={entry.label} value={entry.value} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {item && (
        <section className="mt-12">
          <h2 className="mb-4 border-l-4 border-primary pl-4 text-lg font-bold uppercase tracking-widest text-foreground">
            作品紹介
          </h2>
          <p className="max-w-3xl whitespace-pre-wrap leading-relaxed text-muted-foreground">{item.description}</p>
        </section>
      )}

      <section className="mt-16 border-t border-border pt-10">
        <h2 className="mb-6 text-2xl font-bold text-foreground">上映スケジュール</h2>

        <div className="mb-6">
          <button
            onClick={() => setDate("")}
            className={`mb-3 shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              !selectedDate ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            すべて
          </button>
          <DateSelector days={days} selectedDate={selectedDate} onSelect={setDate} />
        </div>

        {loading && <p className="text-muted-foreground">読み込み中...</p>}
        {!loading && error && <p className="text-primary">{error}</p>}
        {!loading && !error && data?.schedules.length === 0 && (
          <p className="text-muted-foreground">選択した日の上映スケジュールはありません。</p>
        )}
        {data && (
          <ScheduleGrid
            schedules={data.schedules}
            itemId={data.item.id}
            selectedDate={selectedDate}
            screeningType={selectedType}
          />
        )}
      </section>

      {selectedType === "movie" && relatedProducts.length > 0 && (
        <section className="mt-16 border-t border-border pt-10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">関連グッズ</h2>
            <Link to="/goods" className="text-sm font-bold text-muted-foreground transition-colors hover:text-primary">
              グッズ一覧へ →
            </Link>
          </div>
          <div className="-mx-4 overflow-x-auto px-4">
            <div className="flex gap-4 pb-4">
              {relatedProducts.map((product) => (
                <div key={product.id} className="w-36 shrink-0 md:w-44">
                  <ProductCard product={product} compact />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {relatedItems.length > 0 && (
        <section className="mt-16 border-t border-border pt-10">
          <h2 className="mb-6 text-2xl font-bold text-foreground">{getRelatedLabel(selectedType)}</h2>
          <div className="-mx-4 overflow-x-auto px-4">
            <div className="flex gap-4 pb-4">
              {relatedItems.map((relatedItem) => (
                <div key={relatedItem.id} className="w-36 shrink-0 md:w-44">
                  <ScreeningGridCard screening={relatedItem} selectedDate={selectedDate} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function FragmentRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span className="font-bold uppercase tracking-wider text-white/40">{label}</span>
      <span className="text-white/80">{value}</span>
    </>
  )
}
