import { Link, useParams } from "react-router"
import { useRef, useState, useEffect } from "react"
import { useSchedules } from "~/features/movie/useSchedules"
import { apiFetch } from "~/shared/api/client"
import type { Movie } from "~/entities/movie/types"
import { MovieGridCard } from "~/widgets/MovieCard"
import { DateSelector } from "~/widgets/DateSelector"
import { ScheduleGrid } from "~/widgets/ScheduleGrid"
import { GoodsCard, type GoodsItem } from "~/widgets/GoodsCard"
import { proxyImageUrl } from "~/shared/lib/image"

const MOCK_META = {
  director: '山田 太郎',
  cast: ['田中 花子', '佐藤 次郎', '鈴木 三郎', '高橋 四郎'],
  officialUrl: 'https://example.com',
}

const RELATED_GOODS: GoodsItem[] = [
  { title: "アクリルスタンド", movie: "", price: "1,800", isNew: true },
  { title: "クリアファイルセット", movie: "", price: "600" },
  { title: "Tシャツ（M/L/XL）", movie: "", price: "3,200", isSoldOut: true },
]

function extractColor(img: HTMLImageElement): { r: number; g: number; b: number } | null {
  try {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return null
    canvas.width = 50
    canvas.height = 50
    ctx.drawImage(img, 0, 0, 50, 50)
    const { data } = ctx.getImageData(0, 0, 50, 50)
    let r = 0, g = 0, b = 0
    const count = data.length / 4
    for (let i = 0; i < data.length; i += 4) {
      r += data[i]; g += data[i + 1]; b += data[i + 2]
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

export default function MovieDetailPage() {
  const { movieId } = useParams<{ movieId: string }>()
  const { data, loading, error, days, selectedDate, setDate, selectSchedule } = useSchedules()
  const imgRef = useRef<HTMLImageElement>(null)
  const [rgb, setRgb] = useState({ r: 15, g: 15, b: 30 })
  const [relatedMovies, setRelatedMovies] = useState<Movie[]>([])

  useEffect(() => {
    apiFetch<{ items: Movie[] }>('/movies')
      .then(res => setRelatedMovies(res.items.filter(m => m.id !== Number(movieId))))
      .catch(() => {})
  }, [movieId])

  function handleImageLoad() {
    const img = imgRef.current
    if (!img) return
    const color = extractColor(img)
    if (color) setRgb(color)
  }

  return (
    <div className="pb-16">
      {/* ヒーロー: フル幅グラデーション */}
      <div
        className="transition-[background] duration-1000"
        style={{
          marginLeft: 'calc(50% - 50vw)',
          marginRight: 'calc(50% - 50vw)',
          marginTop: '-4rem',
          paddingTop: '4rem',
          background: `linear-gradient(to bottom, rgba(${rgb.r},${rgb.g},${rgb.b},0.95) 0%, rgba(${rgb.r},${rgb.g},${rgb.b},0.4) 60%, transparent 100%)`,
        }}
      >
        <div className="container-center pt-8 pb-16">
          <nav className="mb-8 text-sm text-white/60">
            <Link
              to={`/movies${selectedDate ? `?date=${selectedDate}` : ""}`}
              className="hover:text-white transition-colors"
            >
              映画一覧
            </Link>
            <span className="mx-2 opacity-40">/</span>
            <span className="text-white">{data?.movie.title ?? "…"}</span>
          </nav>

          {data && (
            <div className="flex flex-col gap-8 md:flex-row md:items-end">
              {/* ポスター */}
              <div className="w-44 shrink-0 md:w-52">
                {data.movie.thumbnailUrl ? (
                  <img
                    ref={imgRef}
                    src={proxyImageUrl(data.movie.thumbnailUrl)}
                    alt={data.movie.title}
                    crossOrigin="anonymous"
                    onLoad={handleImageLoad}
                    className="w-full aspect-[2/3] rounded-xl object-cover shadow-2xl"
                  />
                ) : (
                  <div className="flex aspect-[2/3] w-full items-center justify-center rounded-xl bg-white/10 text-6xl shadow-2xl">
                    🎬
                  </div>
                )}
              </div>

              {/* 情報 */}
              <div className="flex-1 pb-2">
                <span className={`inline-block rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  data.movie.status === "now_showing"
                    ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-300"
                    : "border-orange-500/30 bg-orange-500/20 text-orange-300"
                }`}>
                  {data.movie.status === "now_showing" ? "上映中" : "上映予定"}
                </span>

                <h1 className="mt-4 text-4xl font-black tracking-tighter text-white md:text-5xl lg:text-6xl">
                  {data.movie.title}
                </h1>

                <div className="mt-4 flex items-center gap-3 text-sm font-medium text-white/60">
                  <span>{data.movie.durationMin}分</span>
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
                    className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-2 text-sm font-bold text-white hover:bg-white/10 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    公式サイト
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 作品紹介 */}
      {data && (
        <section className="mt-12">
          <h2 className="mb-4 border-l-4 border-primary pl-4 text-lg font-bold uppercase tracking-widest text-foreground">
            作品紹介
          </h2>
          <p className="max-w-3xl leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {data.movie.description}
          </p>
        </section>
      )}

      {/* 上映スケジュール */}
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

        {loading && <p className="text-muted-foreground">読み込み中…</p>}
        {error && <p className="text-primary">{error}</p>}
        {!loading && !error && data?.schedules.length === 0 && (
          <p className="text-muted-foreground">選択した日の上映回はありません。</p>
        )}
        {data && (
          <ScheduleGrid schedules={data.schedules} movieId={data.movie.id} selectedDate={selectedDate} />
        )}
      </section>

      {/* 関連グッズ */}
      <section className="mt-16 border-t border-border pt-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">関連グッズ</h2>
          <Link
            to="/goods"
            className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
          >
            グッズ一覧へ →
          </Link>
        </div>
        <div className="-mx-4 overflow-x-auto px-4">
          <div className="flex gap-4 pb-4">
            {RELATED_GOODS.map((item, i) => (
              <div key={i} className="w-36 shrink-0 md:w-44">
                <GoodsCard item={item} showNew={item.isNew} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 関連映画 */}
      {relatedMovies.length > 0 && (
        <section className="mt-16 border-t border-border pt-10">
          <h2 className="mb-6 text-2xl font-bold text-foreground">関連映画</h2>
          <div className="-mx-4 overflow-x-auto px-4">
            <div className="flex gap-4 pb-4">
              {relatedMovies.map(movie => (
                <div key={movie.id} className="w-36 shrink-0 md:w-44">
                  <MovieGridCard movie={movie} selectedDate={selectedDate} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
