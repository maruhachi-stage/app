import type { Route } from "./+types/goods"
import { GoodsCard } from "~/widgets/GoodsCard"
import type { GoodsItem } from "~/widgets/GoodsCard"

export function meta(_: Route.MetaArgs) {
  return [
    { title: "グッズショップ | HALシネマ" },
    { name: "description", content: "映画関連グッズ・オリジナルアイテム" },
  ]
}

const SAMPLE_ITEMS: GoodsItem[] = Array.from({ length: 12 }, (_, i) => ({
  title: "商品名",
  movie: "作品名",
  price: "2,000",
  isSoldOut: i % 3 === 0,
  isNew: i === 0,
}))

export default function Goods() {
  return (
    <div className="pb-16">
      {/* カルーセルセクション (プレースホルダー) */}
      <div className="relative mb-12 pt-8">
        <div className="flex items-center justify-center gap-4 px-4 overflow-hidden">
          <button className="h-12 w-8 shrink-0 rounded bg-foreground/10 flex items-center justify-center hover:bg-foreground/20 transition-colors">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-40 w-80 shrink-0 rounded-lg bg-muted ${i !== 2 ? "opacity-50 scale-90" : ""}`} />
            ))}
          </div>
          <button className="h-12 w-8 shrink-0 rounded bg-foreground/10 flex items-center justify-center hover:bg-foreground/20 transition-colors">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        <div className="mt-6 flex justify-center gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`h-2 w-2 rounded-full ${i === 1 ? "bg-foreground" : "bg-muted-foreground/30"}`} />
          ))}
        </div>
      </div>

      <div className="container-center">
        <div className="mb-12 flex items-center justify-between rounded-xl bg-muted/50 p-4 border border-border">
          <div className="flex-1" />
          <button className="flex items-center gap-2 text-sm font-bold hover:text-primary transition-colors">
            <span>映画ごとに絞り込む</span>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-10">
          {SAMPLE_ITEMS.map((item, i) => (
            <GoodsCard key={i} item={item} showNew={i === 0} />
          ))}
        </div>
      </div>
    </div>
  )
}
