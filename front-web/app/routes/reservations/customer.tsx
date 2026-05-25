import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { Button } from "~/shared/ui/Button"
import { Input } from "~/shared/ui/Input"
import { useCustomerForm } from "~/features/reservation/useCustomerForm"
import { useReservationFlow } from "~/processes/reservation-flow/context"
import { getAuthState } from "~/shared/api/auth"
import { apiFetch } from "~/shared/api/client"

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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="py-6">
      <p className="mb-4 text-xs text-gray-400">日付・時間・座席 → お客様情報 → 券種選択 → 決済 → 確認</p>
      <h1 className="mb-6 text-2xl font-bold">お客様情報の入力</h1>
      <form onSubmit={e => { e.preventDefault(); handleNext() }} className="flex flex-col gap-4">
        <Input id="email" type="email" label="メールアドレス" value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="example@email.com" required autoComplete="email" error={errors.email} />
        <p className="text-xs text-gray-500">ご入力いただいたメールアドレスに予約完了のご案内をお送りします。</p>
        <Button type="submit" size="lg">次へ（予約確認）</Button>
      </form>
    </div>
  )
}
