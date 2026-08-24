import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { Button } from "~/components/Button"
import { Input } from "~/components/Input"
import { useCustomerForm } from "~/features/reservation/useCustomerForm"
import { useReservationFlow } from "~/components/ReservationFlowProvider"
import { getAuthState } from "~/lib/api/auth"
import { apiFetch } from "~/lib/api-client"

export default function CustomerPage() {
  const navigate = useNavigate()
  const { canProceedTo, setBookingType, setCustomer } = useReservationFlow()
  const { email, setEmail, errors, submit } = useCustomerForm()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const result = canProceedTo("customer")
    if (!result.ok) { navigate(result.redirectTo, { replace: true }); return }

    getAuthState().then(async auth => {
      if (auth.authenticated) {
        setBookingType("member")
        try {
          const profile = await apiFetch<{ email: string }>("/members/profile")
          setCustomer({ email: profile.email })
          navigate("/reservations/tickets", { replace: true })
          return
        } catch {}
      }
      setIsReady(true)
    })
  }, [])

  function handleNext() {
    if (submit()) navigate("/reservations/tickets")
  }

  if (!isReady) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="py-12">
      <div className="text-center mb-10">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Step 2 / 5</p>
        <h1 className="text-3xl font-black tracking-tight">お客様情報の入力</h1>
        <p className="mt-2 text-sm text-muted-foreground">予約完了のご案内をお送りするメールアドレスを入力してください。</p>
      </div>
      <form onSubmit={e => { e.preventDefault(); handleNext() }} className="flex flex-col gap-4">
        <Input id="email" type="email" label="メールアドレス" value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="example@email.com" required autoComplete="email" error={errors.email} />
        <Button type="submit" size="lg" className="h-14 text-base font-black">次へ（券種選択）</Button>
      </form>
    </div>
  )
}
