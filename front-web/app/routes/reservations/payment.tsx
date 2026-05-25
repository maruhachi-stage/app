import { useEffect, type FormEvent } from "react"
import { useNavigate } from "react-router"
import { usePayment } from "~/features/reservation/usePayment"
import { useReservationFlow } from "~/processes/reservation-flow/context"
import { PaymentForm } from "~/widgets/PaymentForm"

export default function PaymentPage() {
  const navigate = useNavigate()
  const { canProceedTo, state } = useReservationFlow()
  const { cardNo, setCardNo, expiry, setExpiry, cvv, setCvv, errors, submit } = usePayment()
  const totalPrice = state.totalPrice ?? 0

  useEffect(() => {
    const result = canProceedTo("payment")
    if (!result.ok) navigate(result.redirectTo, { replace: true })
  }, [])

  function handleNext(e: FormEvent) {
    e.preventDefault()
    if (submit()) navigate("/reservations/confirm")
  }

  return (
    <div className="py-12">
      <div className="text-center mb-10">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Step 4 / 5</p>
        <h1 className="text-3xl font-black tracking-tight">お支払い情報</h1>
        <p className="mt-2 text-sm text-muted-foreground">クレジットカード情報を入力してください。</p>
      </div>

      <PaymentForm
        totalPrice={totalPrice}
        cardNo={cardNo}
        setCardNo={setCardNo}
        expiry={expiry}
        setExpiry={setExpiry}
        cvv={cvv}
        setCvv={setCvv}
        errors={errors}
        onSubmit={handleNext}
        submitLabel="次へ（内容を確認）"
      />
    </div>
  )
}
