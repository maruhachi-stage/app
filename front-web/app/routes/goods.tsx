import { useMemo, useState } from "react"
import type { Route } from "./+types/goods"
import { goodsProducts } from "~/entities/product/sampleProducts"
import { ProductCard } from "~/widgets/ProductCard"

export function meta(_: Route.MetaArgs) {
  return [
    { title: "グッズショップ | HALシネマ" },
    { name: "description", content: "映画関連グッズ・オリジナルアイテム" },
  ]
}

export default function Goods() {
  const movieTitles = useMemo(
    () => Array.from(new Set(goodsProducts.map((product) => product.movieTitle).filter(Boolean))),
    [],
  )
  const [movieFilter, setMovieFilter] = useState("all")
  const visibleProducts = goodsProducts.filter(
    (product) => movieFilter === "all" || product.movieTitle === movieFilter,
  )

  return (
    <div className="pb-16">
      <div className="relative mb-12 pt-8">
        <div className="flex items-center justify-center gap-4 overflow-hidden px-4">
          <div className="flex gap-4 overflow-hidden">
            {goodsProducts.slice(0, 3).map((product, index) => (
              <div
                key={product.id}
                className={`relative h-40 w-80 shrink-0 overflow-hidden rounded-lg border border-border bg-muted ${
                  index === 1 ? "" : "scale-90 opacity-60"
                }`}
              >
                <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <p className="text-[10px] font-bold text-white/70">{product.movieTitle}</p>
                  <p className="text-sm font-black text-white">{product.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container-center">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            作品ごとに絞り込み、商品カードからそのままカートへ追加できます。
          </p>
          <div className="flex flex-wrap gap-2">
            <FilterButton active={movieFilter === "all"} onClick={() => setMovieFilter("all")}>
              すべて
            </FilterButton>
            {movieTitles.map((title) => (
              <FilterButton key={title} active={movieFilter === title} onClick={() => setMovieFilter(title!)}>
                {title}
              </FilterButton>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  )
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border px-3 py-1.5 text-xs font-bold transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:bg-background"
      }`}
    >
      {children}
    </button>
  )
}
