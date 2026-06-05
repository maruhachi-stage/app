import { useEffect, useMemo, useState } from "react"
import type { Route } from "./+types/home"

type ApiResponse<T> = { data: T }

type ProductCategory = "goods" | "food" | "drink" | "set"
type PaymentMethod = "cash" | "card" | "qr"

type PosProduct = {
  id: number
  slug: string
  name: string
  category: ProductCategory
  price: number
  imageUrl: string | null
  stockQuantity: number | null
  isActive: boolean
}

type CartLine = {
  product: PosProduct
  quantity: number
}

type PosSale = {
  id: number
  saleCode: string
  totalAmount: number
  paymentMethod: PaymentMethod
  createdAt: string
}

const CATEGORY_LABELS: Record<ProductCategory | "all", string> = {
  all: "すべて",
  food: "フード",
  drink: "ドリンク",
  set: "セット",
  goods: "グッズ",
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "現金",
  card: "カード",
  qr: "QR",
}

export function meta(_: Route.MetaArgs) {
  return [
    { title: "物販レジ | HAL Cinema" },
    { name: "description", content: "HAL Cinema 物販レジシステム" },
  ]
}

export default function Home() {
  const [products, setProducts] = useState<PosProduct[]>([])
  const [sales, setSales] = useState<PosSale[]>([])
  const [cart, setCart] = useState<CartLine[]>([])
  const [category, setCategory] = useState<ProductCategory | "all">("all")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    void loadRegister()
  }, [])

  const visibleProducts = products.filter((product) => {
    if (category !== "all" && product.category !== category) return false
    return true
  })

  const totalCount = cart.reduce((sum, line) => sum + line.quantity, 0)
  const totalAmount = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0)
  const canCheckout = cart.length > 0 && !submitting

  const todayTotal = useMemo(
    () => sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
    [sales],
  )

  async function loadRegister() {
    setLoading(true)
    setError("")
    try {
      const [productData, salesData] = await Promise.all([
        apiFetch<{ items: PosProduct[] }>("/pos/products"),
        apiFetch<{ items: PosSale[] }>("/pos/sales?limit=8"),
      ])
      setProducts(productData.items)
      setSales(salesData.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : "レジ情報の読み込みに失敗しました")
    } finally {
      setLoading(false)
    }
  }

  function addToCart(product: PosProduct) {
    if (!product.isActive || product.stockQuantity === 0) return
    setMessage("")
    setError("")
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id)
      if (existing) {
        const nextQuantity = existing.quantity + 1
        if (product.stockQuantity !== null && nextQuantity > product.stockQuantity) return current
        return current.map((line) =>
          line.product.id === product.id ? { ...line, quantity: nextQuantity } : line,
        )
      }
      return [...current, { product, quantity: 1 }]
    })
  }

  function updateQuantity(productId: number, delta: number) {
    setCart((current) =>
      current
        .map((line) => {
          if (line.product.id !== productId) return line
          const nextQuantity = line.quantity + delta
          if (nextQuantity <= 0) return null
          if (line.product.stockQuantity !== null && nextQuantity > line.product.stockQuantity) {
            return line
          }
          return { ...line, quantity: nextQuantity }
        })
        .filter((line): line is CartLine => line !== null),
    )
  }

  async function checkout() {
    if (!canCheckout) return
    setSubmitting(true)
    setError("")
    setMessage("")
    try {
      const result = await apiFetch<{ saleCode: string; totalAmount: number }>("/pos/sales", {
        method: "POST",
        body: JSON.stringify({
          paymentMethod,
          items: cart.map((line) => ({
            productId: line.product.id,
            quantity: line.quantity,
          })),
        }),
      })
      setMessage(`会計完了: ${result.saleCode} / ${formatPrice(result.totalAmount)}`)
      setCart([])
      await loadRegister()
    } catch (err) {
      setError(err instanceof Error ? err.message : "会計登録に失敗しました")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-red-700">HAL Cinema POS</p>
            <h1 className="text-2xl font-black tracking-tight">物販レジ</h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-500">直近売上</p>
            <p className="text-xl font-black">{formatPrice(todayTotal)}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {(["all", "food", "drink", "set", "goods"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`h-10 rounded border px-4 text-sm font-bold transition ${
                  category === item
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-950"
                }`}
              >
                {CATEGORY_LABELS[item]}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="rounded border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
              読み込み中
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {visibleProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addToCart(product)}
                  disabled={!product.isActive || product.stockQuantity === 0}
                  className="group overflow-hidden rounded border border-neutral-200 bg-white text-left shadow-sm transition hover:border-neutral-950 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <div className="aspect-[4/3] bg-neutral-200">
                    {product.imageUrl ? (
                      <img
                        src={proxyImageUrl(product.imageUrl)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="rounded bg-neutral-100 px-2 py-1 text-[11px] font-bold text-neutral-600">
                        {CATEGORY_LABELS[product.category]}
                      </span>
                      <span className="text-[11px] font-bold text-neutral-500">
                        在庫 {product.stockQuantity ?? "-"}
                      </span>
                    </div>
                    <p className="min-h-10 text-sm font-bold leading-tight">{product.name}</p>
                    <p className="mt-2 text-lg font-black text-red-700">{formatPrice(product.price)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="h-fit rounded border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-200 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">会計</h2>
              <button
                type="button"
                onClick={() => setCart([])}
                className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-bold text-neutral-600 hover:border-red-700 hover:text-red-700"
              >
                取消
              </button>
            </div>
            <p className="mt-1 text-xs text-neutral-500">{totalCount}点</p>
          </div>

          <div className="max-h-[360px] overflow-y-auto p-4">
            {cart.length === 0 ? (
              <p className="rounded border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
                商品を選択してください
              </p>
            ) : (
              <div className="space-y-3">
                {cart.map((line) => (
                  <div key={line.product.id} className="flex gap-3 border-b border-neutral-100 pb-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{line.product.name}</p>
                      <p className="mt-1 text-xs text-neutral-500">{formatPrice(line.product.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(line.product.id, -1)}
                        className="flex h-8 w-8 items-center justify-center rounded border border-neutral-300 font-bold"
                      >
                        -
                      </button>
                      <span className="w-7 text-center text-sm font-black">{line.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(line.product.id, 1)}
                        className="flex h-8 w-8 items-center justify-center rounded border border-neutral-300 font-bold"
                      >
                        +
                      </button>
                    </div>
                    <p className="w-20 text-right text-sm font-black">
                      {formatPrice(line.product.price * line.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-neutral-200 p-4">
            <div className="mb-4 flex items-end justify-between">
              <span className="text-sm font-bold text-neutral-500">合計</span>
              <span className="text-3xl font-black">{formatPrice(totalAmount)}</span>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-2">
              {(["cash", "card", "qr"] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`h-11 rounded border text-sm font-bold ${
                    paymentMethod === method
                      ? "border-red-700 bg-red-700 text-white"
                      : "border-neutral-300 bg-white text-neutral-700"
                  }`}
                >
                  {PAYMENT_LABELS[method]}
                </button>
              ))}
            </div>

            {error && <p className="mb-3 rounded bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
            {message && <p className="mb-3 rounded bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</p>}

            <button
              type="button"
              onClick={checkout}
              disabled={!canCheckout}
              className="h-14 w-full rounded bg-neutral-950 text-lg font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {submitting ? "登録中" : "会計確定"}
            </button>
          </div>

          <div className="border-t border-neutral-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-black">直近会計</h2>
              <button type="button" onClick={loadRegister} className="text-xs font-bold text-red-700">
                更新
              </button>
            </div>
            <div className="space-y-2">
              {sales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between rounded bg-neutral-50 px-3 py-2">
                  <div>
                    <p className="text-xs font-black">{sale.saleCode}</p>
                    <p className="text-[11px] text-neutral-500">{PAYMENT_LABELS[sale.paymentMethod]}</p>
                  </div>
                  <p className="text-sm font-black">{formatPrice(sale.totalAmount)}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {}
  if (options?.body !== undefined) headers["Content-Type"] = "application/json"

  const res = await fetch(`/api${path}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
    credentials: "include",
  })
  const payload = await res.json().catch(() => null)
  if (!res.ok) {
    const message = payload?.error?.message ?? `HTTP ${res.status}`
    throw new Error(message)
  }
  return (payload as ApiResponse<T>).data
}

function proxyImageUrl(url: string | null): string | undefined {
  if (!url) return undefined
  return url.replace(/^https?:\/\/localhost:3001/, "/img-proxy")
}

function formatPrice(price: number): string {
  return `¥${price.toLocaleString("ja-JP")}`
}
