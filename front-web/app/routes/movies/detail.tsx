import { Link, useParams } from "react-router"
import { useEffect, useRef, useState } from "react"
import { useSchedules } from "~/features/screening/useSchedules"
import { useProducts } from "~/features/product/useProducts"
import { apiFetch } from "~/lib/api-client"
import type { Screening } from "~/features/screening/domain/screening"
import { ScreeningGridCard } from "~/components/ScreeningCard"
import { DateSelector } from "~/components/DateSelector"
import { ScheduleGrid } from "~/components/ScheduleGrid"
import { ProductCard } from "~/components/ProductCard"
import { proxyImageUrl } from "~/lib/image"

const MOCK_META = {
  director: "山田 太郎",
  cast: ["田中 花子", "佐藤 次郎", "鈴木 三郎", "高橋 四郎"],
  officialUrl: "https://example.com",
}

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

function statusLabel(status: Screening["status"]): string {
  return status === "now_showing" ? "上映中" : "上映予定"
}

export default function MovieDetailPage() {
  const { movieId } = useParams<{ movieId: string }>()
  const { data, loading, error, days, selectedDate, setDate } = useSchedules({
    type: "movie",
    idParamName: "movieId",
  })
  const { products } = useProducts("goods")
  const imgRef = useRef<HTMLImageElement>(null)
  const [rgb, setRgb] = useState({ r: 15, g: 15, b: 30 })
  const [relatedMovies, setRelatedMovies] = useState<Screening[]>([])

  const movie = data?.item
  const relatedProducts = products
    .filter((product) => !movie?.title || !product.movieTitle || product.movieTitle === movie.title)
    .slice(0, 8)

  useEffect(() => {
    if (!movieId) return

    apiFetch<{ items: Screening[] }>("/movies")
      .then((res) => {
        setRelatedMovies(
          res.items
            .filter((item) => item.id !== Number(movieId))
            .map((item) => ({ ...item, type: "movie" as const })),
        )
      })
      .catch(() => {
        setRelatedMovies([])
      })
  }, [movieId])

  function handleImageLoad() {
    const img = imgRef.current
    if (!img) return

    const color = extractColor(img)
    if (color) setRgb(color)
  }

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
              to={`/screenings?type=movie${selectedDate ? `&date=${selectedDate}` : ""}`}
              className="transition-colors hover:text-white"
            >
              映画一覧
            </Link>
            <span className="mx-2 opacity-40">/</span>
            <span className="text-white">{movie?.title ?? "詳細"}</span>
          </nav>

          {loading && <p className="text-white/80">読み込み中...</p>}
          {error && <p className="text-red-200">{error}</p>}

          {movie && (
            <div className="flex flex-col gap-8 md:flex-row md:items-end">
              <div className="w-44 shrink-0 md:w-52">
                {movie.thumbnailUrl ? (
                  <img
                    ref={imgRef}
                    src={proxyImageUrl(movie.thumbnailUrl)}
                    alt={movie.title}
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
                <span
                  className={`inline-block rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                    movie.status === "now_showing"
                      ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-300"
                      : "border-orange-500/30 bg-orange-500/20 text-orange-300"
                  }`}
                >
                  {statusLabel(movie.status)}
                </span>

                <h1 className="mt-4 text-4xl font-black tracking-tighter text-white md:text-5xl lg:text-6xl">
                  {movie.title}
                </h1>

                <div className="mt-4 flex items-center gap-3 text-sm font-medium text-white/60">
                  <span>{movie.durationMin}分</span>
                  <span className="h-1 w-1 rounded-full bg-white/30" />
                  <span>2D / 字幕・吹替</span>
                </div>

                <div className="mt-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm leading-relaxed">
                  <span className="font-bold uppercase tracking-wider text-white/40">監督</span>
                  <span className="text-white/80">{MOCK_META.director}</span>
                  <span className="font-bold uppercase tracking-wider text-white/40">出演</span>
                  <span className="text-white/80">{MOCK_META.cast.join("、")}</span>
                </div>

                <div className="mt-8">
                  <a
                    href={MOCK_META.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-white/10"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    公式サイト
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {movie && (
        <section className="mt-12">
          <h2 className="mb-4 border-l-4 border-primary pl-4 text-lg font-bold uppercase tracking-widest text-foreground">
            作品紹介
          </h2>
          <p className="max-w-3xl whitespace-pre-wrap leading-relaxed text-muted-foreground">
            {movie.description}
          </p>
        </section>
      )}

      <section className="mt-16 border-t border-border pt-10">
        <h2 className="mb-6 text-2xl font-bold text-foreground">上映スケジュール</h2>

        <div className="mb-6">
          <button
            onClick={() => setDate("")}
            className={`mb-3 shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              !selectedDate
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            すべて
          </button>
          <DateSelector days={days} selectedDate={selectedDate} onSelect={setDate} />
        </div>

        {loading && <p className="text-muted-foreground">読み込み中...</p>}
        {!loading && error && <p className="text-primary">{error}</p>}
        {!loading && !error && data?.schedules.length === 0 && (
          <p className="text-muted-foreground">選択した日の上映回はありません。</p>
        )}
        {data && (
          <ScheduleGrid
            schedules={data.schedules}
            itemId={data.item.id}
            selectedDate={selectedDate}
            screeningType="movie"
          />
        )}
      </section>

      {relatedProducts.length > 0 && (
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

      {relatedMovies.length > 0 && (
        <section className="mt-16 border-t border-border pt-10">
          <h2 className="mb-6 text-2xl font-bold text-foreground">関連映画</h2>
          <div className="-mx-4 overflow-x-auto px-4">
            <div className="flex gap-4 pb-4">
              {relatedMovies.map((relatedMovie) => (
                <div key={relatedMovie.id} className="w-36 shrink-0 md:w-44">
                  <ScreeningGridCard screening={relatedMovie} selectedDate={selectedDate} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
