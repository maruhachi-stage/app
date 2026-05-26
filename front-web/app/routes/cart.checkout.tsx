import { useMemo, useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router"
import { formatProductPrice } from "~/entities/product/types"
import { useCart } from "~/features/cart/useCart"
import { Button } from "~/shared/ui/Button"

type FormErrors = {
  name?: string
  cardNumber?: string
  expiry?: string
  securityCode?: string
  pickupTime?: string
}

const PICKUP_TIMES = ["すぐ受け取り", "上映10分前", "上映20分前", "上映後"]

export function meta() {
  return [{ title: "ショップ決済 | HALシネマ" }]
}

export default function CartCheckoutPage() {
  const navigate = useNavigate()
  const { items, totalPrice, totalCount, clearCart } = useCart()
  const [name, setName] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [securityCode, setSecurityCode] = useState("")
  const [pickupTime, setPickupTime] = useState(PICKUP_TIMES[0])
  const [errors, setErrors] = useState<FormErrors>({})
  const [completedOrderCode, setCompletedOrderCode] = useState<string | null>(null)

  const serviceFee = totalPrice > 0 ? 0 : 0
  const paymentTotal = totalPrice + serviceFee
  const cardBrand = useMemo(() => detectCardBrand(cardNumber), [cardNumber])

  if (completedOrderCode) {
    return (
      <div className="container-center max-w-2xl py-16 text-center">
        <p className="text-sm font-bold text-primary">注文を受け付けました</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">受け取り番号</h1>
        <div className="mx-auto my-8 w-fit rounded-lg border border-border bg-card px-8 py-6">
          <p className="text-4xl font-black tracking-[0.2em]">{completedOrderCode}</p>
        </div>
        <p className="mb-8 text-sm leading-7 text-muted-foreground">
          劇場内ショップの受け取りカウンターで、この番号を提示してください。
          デモ実装のため実際の決済通信は行っていません。
        </p>
        <Button type="button" onClick={() => navigate("/shop")}>
          ショップへ戻る
        </Button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container-center py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold">カートに商品がありません</h1>
        <Link to="/shop">
          <Button variant="primary">商品を見る</Button>
        </Link>
      </div>
    )
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const nextErrors = validateForm({ name, cardNumber, expiry, securityCode, pickupTime })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const orderCode = `S${Date.now().toString().slice(-6)}`
    clearCart()
    setCompletedOrderCode(orderCode)
  }

  return (
    <div className="container-center py-8 pb-20">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase text-muted-foreground">Shop Checkout</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">支払い</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-4 text-lg font-bold">受け取り情報</h2>
            <label className="mb-4 block">
              <span className="mb-1.5 block text-xs font-bold text-muted-foreground">受取名</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                className={`w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring ${
                  errors.name ? "border-primary" : "border-input"
                }`}
                placeholder="例: 山田 太郎"
              />
              {errors.name && <span className="mt-1 block text-xs text-primary">{errors.name}</span>}
            </label>

            <div>
              <span className="mb-2 block text-xs font-bold text-muted-foreground">受け取り時間</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PICKUP_TIMES.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setPickupTime(time)}
                    className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${
                      pickupTime === time
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
              {errors.pickupTime && (
                <span className="mt-1 block text-xs text-primary">{errors.pickupTime}</span>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">カード情報</h2>
              <span className="rounded bg-secondary px-2 py-1 text-xs font-black">
                {cardBrand ?? "CARD"}
              </span>
            </div>

            <label className="mb-4 block">
              <span className="mb-1.5 block text-xs font-bold text-muted-foreground">カード番号</span>
              <input
                value={formatCardNumber(cardNumber)}
                onChange={(event) => setCardNumber(event.target.value.replace(/\D/g, "").slice(0, 16))}
                inputMode="numeric"
                autoComplete="cc-number"
                className={`w-full rounded-lg border bg-background px-4 py-3 font-mono tracking-widest outline-none focus:ring-2 focus:ring-ring ${
                  errors.cardNumber ? "border-primary" : "border-input"
                }`}
                placeholder="0000 0000 0000 0000"
              />
              {errors.cardNumber && (
                <span className="mt-1 block text-xs text-primary">{errors.cardNumber}</span>
              )}
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-muted-foreground">有効期限</span>
                <input
                  value={expiry}
                  onChange={(event) => setExpiry(formatExpiry(event.target.value))}
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  className={`w-full rounded-lg border bg-background px-4 py-3 font-mono outline-none focus:ring-2 focus:ring-ring ${
                    errors.expiry ? "border-primary" : "border-input"
                  }`}
                  placeholder="MM/YY"
                />
                {errors.expiry && <span className="mt-1 block text-xs text-primary">{errors.expiry}</span>}
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-muted-foreground">セキュリティコード</span>
                <input
                  value={securityCode}
                  onChange={(event) =>
                    setSecurityCode(event.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  className={`w-full rounded-lg border bg-background px-4 py-3 font-mono outline-none focus:ring-2 focus:ring-ring ${
                    errors.securityCode ? "border-primary" : "border-input"
                  }`}
                  placeholder="123"
                />
                {errors.securityCode && (
                  <span className="mt-1 block text-xs text-primary">{errors.securityCode}</span>
                )}
              </label>
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/cart" className="flex-1">
              <Button type="button" variant="secondary" className="w-full">
                カートへ戻る
              </Button>
            </Link>
            <Button type="submit" variant="primary" className="flex-1">
              {formatProductPrice(paymentTotal)} を支払う
            </Button>
          </div>
        </form>

        <aside className="h-fit rounded-lg border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-bold">注文内容</h2>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 border-b border-border pb-4 last:border-b-0">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-muted">
                  {item.imageUrl && <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold leading-tight">{item.name}</p>
                  {item.options && item.options.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.options.map((option) => option.label).join(" / ")}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">数量 {item.quantity}</p>
                </div>
                <p className="text-sm font-black">{formatProductPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>商品数</span>
              <span>{totalCount} 点</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>手数料</span>
              <span>{formatProductPrice(serviceFee)}</span>
            </div>
            <div className="flex justify-between text-xl font-black">
              <span>合計</span>
              <span>{formatProductPrice(paymentTotal)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function validateForm(values: {
  name: string
  cardNumber: string
  expiry: string
  securityCode: string
  pickupTime: string
}): FormErrors {
  const errors: FormErrors = {}
  if (values.name.trim().length < 2) errors.name = "受取名を入力してください。"
  if (!luhnCheck(values.cardNumber)) errors.cardNumber = "カード番号を確認してください。"
  if (!isValidExpiry(values.expiry)) errors.expiry = "有効期限をMM/YYで入力してください。"
  if (!/^\d{3,4}$/.test(values.securityCode)) {
    errors.securityCode = "3桁または4桁で入力してください。"
  }
  if (!values.pickupTime) errors.pickupTime = "受け取り時間を選択してください。"
  return errors
}

function formatCardNumber(value: string) {
  return value.replace(/(\d{4})(?=\d)/g, "$1 ")
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

function detectCardBrand(value: string) {
  if (/^4/.test(value)) return "VISA"
  if (/^(5[1-5]|2[2-7])/.test(value)) return "Mastercard"
  if (/^35/.test(value)) return "JCB"
  if (/^3[47]/.test(value)) return "AMEX"
  return null
}

function isValidExpiry(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})$/)
  if (!match) return false
  const month = Number(match[1])
  const year = Number(`20${match[2]}`)
  if (month < 1 || month > 12) return false
  const expiryDate = new Date(year, month)
  const now = new Date()
  return expiryDate > new Date(now.getFullYear(), now.getMonth())
}

function luhnCheck(value: string) {
  if (!/^\d{13,16}$/.test(value)) return false
  let sum = 0
  let doubleDigit = false
  for (let index = value.length - 1; index >= 0; index -= 1) {
    let digit = Number(value[index])
    if (doubleDigit) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    doubleDigit = !doubleDigit
  }
  return sum % 10 === 0
}
