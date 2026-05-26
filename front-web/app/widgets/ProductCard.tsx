import { Link } from "react-router"
import {
  PRODUCT_CATEGORY_LABELS,
  formatProductPrice,
  type Product,
  type ProductCategory,
} from "~/entities/product/types"

type Props = {
  product: Product
  compact?: boolean
}

export function ProductCard({ product, compact = false }: Props) {
  const label = product.movieTitle ?? PRODUCT_CATEGORY_LABELS[product.category]
  const detailPath = product.category === "goods" ? `/goods/${product.id}` : `/shop/${product.id}`

  return (
    <article className="group flex h-full flex-col">
      <Link
        to={detailPath}
        className="relative mb-3 block aspect-square overflow-hidden rounded-lg border border-border bg-muted"
        aria-label={`${product.name}の詳細を見る`}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <ProductFallback category={product.category} />
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />

        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          <span className="rounded bg-black/75 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
            {PRODUCT_CATEGORY_LABELS[product.category]}
          </span>
          {product.isNew && (
            <span className="rounded bg-primary px-2 py-1 text-[10px] font-black text-primary-foreground">
              NEW
            </span>
          )}
        </div>

        {product.isSoldOut && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
            <span className="-rotate-6 border-2 border-white px-3 py-1 text-xs font-black text-white">
              SOLD OUT
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col">
        <p className="text-[10px] font-bold text-muted-foreground">{label}</p>
        <Link
          to={detailPath}
          className="mt-1 text-sm font-bold leading-tight text-foreground transition-colors group-hover:text-primary"
        >
          {product.name}
        </Link>

        {!compact && product.description && (
          <p className="mt-2 h-10 overflow-hidden text-xs leading-5 text-muted-foreground">
            {product.description}
          </p>
        )}

        <div className="mt-auto pt-3">
          <span className="rounded bg-secondary px-2.5 py-1 text-xs font-black text-secondary-foreground">
            {formatProductPrice(product.price)}
          </span>
        </div>
      </div>
    </article>
  )
}

function ProductFallback({ category }: { category: ProductCategory }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-background">
      <span className="rounded border border-border bg-background/80 px-3 py-2 text-xs font-bold text-muted-foreground">
        {PRODUCT_CATEGORY_LABELS[category]}
      </span>
    </div>
  )
}
