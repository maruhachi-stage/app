import { useState } from "react"
import type { Route } from "./+types/shop"
import { shopProducts } from "~/entities/product/sampleProducts"
import {
  PRODUCT_CATEGORY_LABELS,
  type ProductCategory,
} from "~/entities/product/types"
import { ProductCard } from "~/widgets/ProductCard"

type MenuFilter = ProductCategory | "all"

const FILTERS: MenuFilter[] = ["all", "food", "drink", "set"]

export function meta(_: Route.MetaArgs) {
  return [
    { title: "フード＆ドリンク | HALシネマ" },
    { name: "description", content: "シアター内で楽しめるフード＆ドリンクメニュー" },
  ]
}

export default function Shop() {
  const [filter, setFilter] = useState<MenuFilter>("all")
  const visibleProducts = shopProducts.filter(
    (product) => filter === "all" || product.category === filter,
  )

  return (
    <div className="pb-16">
      <div className="relative mb-12 pt-8">
        <div className="flex items-center justify-center gap-4 overflow-hidden px-4">
          <div className="flex gap-4 overflow-hidden">
            {shopProducts.slice(0, 3).map((product, index) => (
              <div
                key={product.id}
                className={`relative h-40 w-80 shrink-0 overflow-hidden rounded-lg border border-border bg-muted ${
                  index === 1 ? "" : "scale-90 opacity-60"
                }`}
              >
                <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <p className="text-[10px] font-bold text-white/70">Concession</p>
                  <p className="text-sm font-black text-white">{product.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container-center">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 p-4">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setFilter(category)}
                className={`rounded border px-4 py-1.5 text-xs font-bold transition ${
                  filter === category
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-background"
                }`}
              >
                {category === "all" ? "すべて" : PRODUCT_CATEGORY_LABELS[category]}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            商品カードから注文候補をカートにまとめられます。
          </p>
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
