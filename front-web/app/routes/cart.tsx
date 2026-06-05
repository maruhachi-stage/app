import { Link, useNavigate } from "react-router"
import { useCart } from "~/features/cart/useCart"
import {
  PRODUCT_CATEGORY_LABELS,
  formatProductPrice,
  type ProductCategory,
} from "~/entities/product/types"
import { Button } from "~/shared/ui/Button"

const CART_CATEGORIES: ProductCategory[] = ["goods", "food", "drink", "set"]

export function meta() {
  return [{ title: "カート | HALシネマ" }]
}

export default function CartPage() {
  const navigate = useNavigate()
  const { items, removeItem, updateQuantity, clearCart, totalPrice, totalCount } = useCart()

  if (items.length === 0) {
    return (
      <div className="container-center py-20 text-center">
        <h1 className="mb-3 text-2xl font-bold">カートに商品がありません</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          フードやグッズの商品カードから追加できます。
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/shop">
            <Button variant="secondary">フードを見る</Button>
          </Link>
          <Link to="/goods">
            <Button variant="primary">グッズを見る</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-center pb-36 pt-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-muted-foreground">Product Cart</p>
          <h1 className="text-3xl font-black tracking-tight">カート</h1>
        </div>
        <Button variant="ghost" onClick={clearCart} className="text-muted-foreground">
          すべて削除
        </Button>
      </div>

      <div className="space-y-10">
        {CART_CATEGORIES.map((category) => {
          const categoryItems = items.filter((item) => item.category === category)
          if (categoryItems.length === 0) return null

          return (
            <section key={category}>
              <h2 className="mb-4 border-l-4 border-primary pl-3 text-lg font-bold">
                {PRODUCT_CATEGORY_LABELS[category]}
              </h2>
              <div className="space-y-3">
                {categoryItems.map((item) => (
                  <article
                    key={item.id}
                    className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center"
                  >
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      {item.movieTitle && (
                        <p className="text-xs font-bold text-muted-foreground">{item.movieTitle}</p>
                      )}
                      <h3 className="mt-1 font-bold">{item.name}</h3>
                      {item.options && item.options.length > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.options
                            .map((option) => `${option.groupName}: ${option.label}`)
                            .join(" / ")}
                        </p>
                      )}
                      <p className="mt-1 text-sm font-black text-primary">
                        {formatProductPrice(item.price)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <div className="flex items-center gap-2 rounded-lg bg-muted p-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-background"
                          aria-label={`${item.name}を1点減らす`}
                        >
                          -
                        </button>
                        <span className="w-7 text-center text-sm font-bold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-background"
                          aria-label={`${item.name}を1点増やす`}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="rounded-lg border border-border p-2 text-muted-foreground transition hover:border-primary hover:text-primary"
                        aria-label={`${item.name}を削除`}
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 p-4 backdrop-blur">
        <div className="container-center flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-muted-foreground">合計 {totalCount} 点</p>
            <p className="text-xl font-black">
              {formatProductPrice(totalPrice)}
              <span className="ml-1 text-xs font-normal text-muted-foreground">(税込)</span>
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => navigate("/shop")}>
              商品を追加
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => navigate("/cart/checkout")}
            >
              購入へ進む
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
