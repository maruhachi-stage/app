import { useState, type FormEvent } from "react"
import { Button } from "~/shared/ui/Button"

const CARD_BRANDS = [
  { id: "visa",       label: "VISA",   detect: /^4/ },
  { id: "mastercard", label: "Master", detect: /^(5[1-5]|2[2-7])/ },
  { id: "jcb",        label: "JCB",    detect: /^35(2[89]|[3-8])/ },
  { id: "amex",       label: "AMEX",   detect: /^3[47]/ },
  { id: "diners",     label: "Diners", detect: /^3(0[0-5]|[68])/ },
  { id: "unionpay",   label: "銀聯",   detect: /^62/ },
]

const BRAND_GRADIENTS: Record<string, string> = {
  visa:       "from-blue-900 via-blue-800 to-indigo-700",
  mastercard: "from-zinc-900 via-red-950 to-orange-950",
  jcb:        "from-green-950 via-emerald-900 to-teal-800",
  amex:       "from-teal-950 via-teal-900 to-cyan-900",
  diners:     "from-zinc-900 via-zinc-800 to-zinc-700",
  unionpay:   "from-red-950 via-red-900 to-rose-900",
}
const DEFAULT_GRADIENT = "from-zinc-900 via-zinc-800 to-zinc-700"

function detectBrand(digits: string) {
  return CARD_BRANDS.find(b => b.detect.test(digits)) ?? null
}

function formatCardPreview(digits: string): string {
  const p = digits.padEnd(16, "•")
  return `${p.slice(0,4)}  ${p.slice(4,8)}  ${p.slice(8,12)}  ${p.slice(12,16)}`
}

function handleExpiryInput(raw: string, prev: string): string {
  if (prev.length > raw.length && raw.endsWith("/")) return raw.slice(0, -1)
  const digits = raw.replace(/\D/g, "").slice(0, 4)
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return digits
}

type Errors = { cardNo?: string; expiry?: string; cvv?: string }

type Props = {
  totalPrice: number
  cardNo: string
  setCardNo: (v: string) => void
  expiry: string
  setExpiry: (v: string) => void
  cvv: string
  setCvv: (v: string) => void
  errors: Errors
  onSubmit: (e: FormEvent) => void
  submitLabel?: string
}

export function PaymentForm({
  totalPrice,
  cardNo, setCardNo,
  expiry, setExpiry,
  cvv, setCvv,
  errors,
  onSubmit,
  submitLabel = "次へ進む",
}: Props) {
  const [cvvFocused, setCvvFocused] = useState(false)
  const brand = detectBrand(cardNo)
  const gradient = brand ? (BRAND_GRADIENTS[brand.id] ?? DEFAULT_GRADIENT) : DEFAULT_GRADIENT

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">

      {/* カードビジュアル */}
      <div className="[perspective:1200px]">
        <div
          className="relative w-full [transform-style:preserve-3d] transition-all duration-500"
          style={{ aspectRatio: "1.586", transform: cvvFocused ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          {/* 表面 */}
          <div className={`absolute inset-0 rounded-app bg-gradient-to-br ${gradient} p-5 sm:p-7 flex flex-col justify-between shadow-2xl overflow-hidden [backface-visibility:hidden]`}>
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5" />
            <div className="absolute -left-8 -bottom-12 w-48 h-48 rounded-full bg-white/5" />
            <div className="relative flex items-start justify-between">
              <div className="w-10 h-7 rounded bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-inner flex items-center justify-center">
                <div className="grid grid-cols-2 gap-px w-6">
                  {[0,1,2,3].map(i => <div key={i} className="h-1.5 bg-yellow-700/40 rounded-sm" />)}
                </div>
              </div>
              <span className="text-white/80 font-black text-base tracking-widest">{brand?.label ?? ""}</span>
            </div>
            <div className="relative text-center">
              <span className="text-white font-mono font-bold tracking-[0.18em] text-lg sm:text-2xl drop-shadow select-none">
                {formatCardPreview(cardNo)}
              </span>
            </div>
            <div className="relative flex items-end justify-between">
              <div>
                <p className="text-white/40 text-[8px] uppercase tracking-widest mb-0.5">Valid Thru</p>
                <p className="text-white font-mono font-bold text-sm tracking-widest">{expiry || "MM/YY"}</p>
              </div>
              {brand?.id === "mastercard" && (
                <div className="flex -space-x-3">
                  <div className="w-9 h-9 rounded-full bg-red-500/80" />
                  <div className="w-9 h-9 rounded-full bg-amber-400/80" />
                </div>
              )}
              {brand?.id === "visa" && (
                <span className="text-white/70 font-black text-xl italic tracking-tight">VISA</span>
              )}
              {brand && !["mastercard","visa"].includes(brand.id) && (
                <span className="text-white/60 font-black text-sm tracking-widest">{brand.label}</span>
              )}
            </div>
          </div>

          {/* 裏面 */}
          <div className={`absolute inset-0 rounded-app bg-gradient-to-br ${gradient} flex flex-col gap-6 shadow-2xl overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)]`}>
            <div className="w-full h-14 bg-black/60 mt-8" />
            <div className="px-6 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-10 bg-white/10 rounded" />
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-white/40 text-[8px] uppercase tracking-widest">CVV</span>
                  <div className="w-14 h-10 bg-white rounded flex items-center justify-center">
                    <span className="text-zinc-900 font-mono font-bold text-sm tracking-[0.2em]">
                      {cvv ? "•".repeat(cvv.length) : "•••"}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-white/30 text-[9px] text-right">カード裏面3桁のコード</p>
            </div>
          </div>
        </div>
      </div>

      {/* 対応ブランド */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-wider mr-1">対応</span>
        {CARD_BRANDS.map(b => (
          <span
            key={b.id}
            className={`px-3 py-1 rounded-full text-[10px] font-black border transition-all ${
              brand?.id === b.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-secondary text-muted-foreground/40"
            }`}
          >
            {b.label}
          </span>
        ))}
      </div>

      {/* 合計 */}
      <div className="flex items-center justify-between rounded-app border border-border bg-card px-6 py-4">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">お支払い合計</span>
        <span className="text-2xl font-black text-foreground">
          {totalPrice.toLocaleString()}
          <span className="text-sm font-bold text-muted-foreground ml-1">円</span>
        </span>
      </div>

      {/* 入力フォーム */}
      <div className="rounded-app border border-border bg-card p-6 flex flex-col gap-5">
        {/* カード番号 */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cardNo" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">カード番号</label>
          <div className="relative">
            <input
              id="cardNo"
              value={cardNo}
              onChange={e => setCardNo(e.target.value.replace(/\D/g, "").slice(0, 16))}
              placeholder="0000000000000000"
              inputMode="numeric"
              autoComplete="cc-number"
              className={`w-full rounded-lg border bg-background px-4 py-3.5 font-mono font-bold tracking-[0.25em] text-base outline-none transition focus:ring-2 focus:ring-ring placeholder:tracking-normal placeholder:font-sans placeholder:font-normal ${
                errors.cardNo ? "border-red-500 bg-red-500/10" : "border-input"
              }`}
            />
            {brand && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {brand.label}
              </span>
            )}
          </div>
          {errors.cardNo && <p className="text-xs text-red-500">{errors.cardNo}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* 有効期限 */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="expiry" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">有効期限</label>
            <input
              id="expiry"
              value={expiry}
              onChange={e => setExpiry(handleExpiryInput(e.target.value, expiry))}
              placeholder="MM/YY"
              inputMode="numeric"
              autoComplete="cc-exp"
              className={`rounded-lg border bg-background px-4 py-3.5 font-mono font-bold tracking-widest text-base outline-none transition focus:ring-2 focus:ring-ring placeholder:font-sans placeholder:font-normal placeholder:tracking-normal ${
                errors.expiry ? "border-red-500 bg-red-500/10" : "border-input"
              }`}
            />
            {errors.expiry && <p className="text-xs text-red-500">{errors.expiry}</p>}
          </div>

          {/* セキュリティコード */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cvv" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">セキュリティコード</label>
            <input
              id="cvv"
              value={cvv}
              onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
              onFocus={() => setCvvFocused(true)}
              onBlur={() => setCvvFocused(false)}
              placeholder="CVV"
              inputMode="numeric"
              autoComplete="cc-csc"
              className={`rounded-lg border bg-background px-4 py-3.5 font-mono font-bold tracking-[0.3em] text-base outline-none transition focus:ring-2 focus:ring-ring placeholder:font-sans placeholder:font-normal placeholder:tracking-normal ${
                errors.cvv ? "border-red-500 bg-red-500/10" : "border-input"
              }`}
            />
            {errors.cvv && <p className="text-xs text-red-500">{errors.cvv}</p>}
          </div>
        </div>

        {/* セキュリティバッジ */}
        <div className="flex items-center gap-2 pt-1 border-t border-border">
          <svg className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
          </svg>
          <p className="text-[10px] text-muted-foreground/40 leading-tight">
            SSL/TLS 暗号化通信で保護されています。※デモのためカード情報は送信されません。
          </p>
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full h-14 text-base font-black">
        {submitLabel}
      </Button>
    </form>
  )
}
