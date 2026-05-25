import { useEffect } from "react"
import { useNavigate } from "react-router"
import { Button } from "~/shared/ui/Button"
import { formatJst } from "~/entities/ticket"
import { useConfirm } from "~/features/reservation/useConfirm"
import { useReservationFlow } from "~/processes/reservation-flow/context"
import { useAppConfig } from "~/shared/config"

export default function ConfirmPage() {
  const navigate = useNavigate()
  const { canProceedTo } = useReservationFlow()
  const { schedInfo, customer, seats, card, totalPrice, submitting, error, submit } = useConfirm()
  const { config } = useAppConfig()

  useEffect(() => {
    const result = canProceedTo("confirm")
    if (!result.ok) navigate(result.redirectTo, { replace: true })
  }, [])

  async function handleSubmit() {
    const success = await submit()
    if (success) navigate("/reservations/complete")
  }

  const maskedCard = card ? `**** **** **** ${card.cardNo.slice(-4)}` : ""

  function getTicketInfo(type: string) {
    const t = config?.tickets.find((t) => t.type === type)
    return { label: t?.label ?? type, price: t?.price ?? 0 }
  }

  return (
    <div className="py-6 max-w-xl mx-auto">
      <h1 className="mb-6 text-2xl font-black text-foreground">ご予約内容の確認</h1>
      <p className="mb-6 text-sm text-muted-foreground">以下の内容をご確認の上、「予約を確定する」を押してください。</p>

      <div className="flex flex-col gap-4">
        {schedInfo && (
          <section className="rounded-app border border-border bg-card p-5 shadow-sm">
            <p className="mb-2 text-xs font-bold text-muted-foreground uppercase">上映情報</p>
            <p className="text-lg font-black text-foreground">{schedInfo.movieTitle}</p>
            <p className="mt-1 text-sm font-bold text-muted-foreground">
              {formatJst(schedInfo.startsAt)} / {schedInfo.screenName}
            </p>
          </section>
        )}

        {seats && seats.length > 0 && (
          <section className="rounded-app border border-border bg-card p-5 shadow-sm">
            <p className="mb-3 text-xs font-bold text-muted-foreground uppercase">座席・券種</p>
            <div className="flex flex-col gap-2">
              {seats.map(seat => {
                const info = getTicketInfo(seat.ticketType)
                return (
                  <div key={seat.seatId} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-[10px] font-black text-white">
                        {seat.row}-{seat.col}
                      </span>
                      <span className="font-bold text-foreground">{info.label}</span>
                    </div>
                    <span className="font-bold text-foreground">{info.price.toLocaleString()}円</span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {customer && (
          <section className="rounded-app border border-border bg-card p-5 shadow-sm">
            <p className="mb-2 text-xs font-bold text-muted-foreground uppercase">お客様情報</p>
            <p className="text-sm font-bold text-foreground">{customer.email}</p>
          </section>
        )}

        {card && (
          <section className="rounded-app border border-border bg-card p-5 shadow-sm">
            <p className="mb-2 text-xs font-bold text-muted-foreground uppercase">お支払い情報</p>
            <p className="text-sm font-bold text-foreground">{maskedCard}</p>
            <p className="mt-1 text-xs text-muted-foreground">有効期限: {card.expiry}</p>
          </section>
        )}

        <div className="flex items-center justify-between rounded-app border-2 border-foreground bg-card px-5 py-4">
          <span className="text-sm font-bold text-muted-foreground">合計金額</span>
          <span className="text-2xl font-black text-foreground">{totalPrice.toLocaleString()}円</span>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-8">
        <Button
          size="lg"
          className="w-full h-14 text-lg font-black"
          disabled={submitting}
          onClick={handleSubmit}
        >
          {submitting ? "処理中..." : "予約を確定する"}
        </Button>
      </div>
    </div>
  )
}
