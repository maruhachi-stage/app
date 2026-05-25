import { useEffect } from "react"
import { Link, useNavigate } from "react-router"
import { Button } from "~/shared/ui/Button"
import { useEntry } from "~/features/reservation/useEntry"
import { useReservationFlow } from "~/processes/reservation-flow/context"

export default function EntryPage() {
  const navigate = useNavigate()
  const { canProceedTo } = useReservationFlow()
  const { selectGuest } = useEntry()

  useEffect(() => {
    const result = canProceedTo("entry")
    if (!result.ok) navigate(result.redirectTo, { replace: true })
  }, [])

  function handleGuest() {
    selectGuest()
    navigate("/reservations/customer")
  }

  return (
    <div className="py-12">
      <div className="text-center mb-10">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Step 2 / 5</p>
        <h1 className="text-3xl font-black tracking-tight">予約方法の選択</h1>
        <p className="mt-2 text-sm text-muted-foreground">会員の方はログインすると、スムーズに予約いただけます。</p>
      </div>

      <div className="rounded-app border border-border bg-card shadow-sm p-8 flex flex-col gap-4">
        <Link to="/login?redirect=/reservations/customer">
          <Button size="lg" className="w-full">ログインして予約</Button>
        </Link>
        <Link to="/register?redirect=/reservations/customer">
          <Button size="lg" variant="secondary" className="w-full">新規会員登録して予約</Button>
        </Link>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={handleGuest}
          className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto"
        >
          <span>ゲストとして予約を続ける</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
