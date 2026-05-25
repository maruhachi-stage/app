import { useEffect, useState } from "react"
import { useLocation, useNavigate, Link } from "react-router"
import { draft } from "~/entities/reservation/draft"

export function HoldTimer() {
  const location = useLocation()
  const navigate = useNavigate()
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isExpired, setIsExpired] = useState(false)

  const isReservationFlow = location.pathname.startsWith("/reservations/")
  const isAuthFlow = location.pathname.startsWith("/login") || location.pathname.startsWith("/register") || location.pathname.startsWith("/auth/otp")

  useEffect(() => {
    const updateTimer = () => {
      const d = draft.get()
      if (!d.expiresAt || !d.reservationCode) {
        setTimeLeft(null)
        setIsExpired(false)
        return
      }

      const expiry = new Date(d.expiresAt).getTime()
      const now = Date.now()
      const diff = Math.floor((expiry - now) / 1000)

      if (diff <= 0) {
        setTimeLeft(0)
        if (!isExpired) {
          setIsExpired(true)
          handleExpire()
        }
      } else {
        setTimeLeft(diff)
        setIsExpired(false)
      }
    }

    const interval = setInterval(updateTimer, 1000)
    updateTimer()

    return () => clearInterval(interval)
  }, [location.pathname, isExpired])

  function getResumeUrl(): string {
    const d = draft.get()
    if (!d.bookingType) return "/reservations/entry"
    if (!d.customer) return "/reservations/customer"
    return "/reservations/tickets"
  }

  function handleCancel() {
    if (!window.confirm("仮予約をキャンセルしますか？\n座席の仮押さえが解除されます。")) return
    draft.clear()
    navigate("/movies")
  }

  function handleExpire() {
    const d = draft.get()
    if (!d.reservationCode) return
    draft.clear()
    alert("予約の有効期限が切れました。座席を選び直してください。")
    navigate("/movies")
  }

  if (timeLeft === null) return null

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <div className="bg-red-600 text-white py-2 px-3 sm:px-4 z-40 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:flex-nowrap sm:justify-center sm:gap-6 animate-in slide-in-from-top duration-300">
      {/* 情報グループ: ドット + ラベル + タイマー */}
      <div className="flex items-center gap-3 sm:gap-6">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest">Seat Secured</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs font-bold text-red-100">予約完了まであと</span>
          <span className={`font-mono text-xl font-black ${timeLeft < 60 ? 'animate-pulse' : ''}`}>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* ボタングループ */}
      <div className="flex items-center gap-2 sm:gap-4">
        {!isReservationFlow && !isAuthFlow && (
          <Link
            to={getResumeUrl()}
            className="rounded-full bg-white px-3 py-1 text-xs font-black text-red-600 hover:bg-red-50 transition-colors shadow-sm"
          >
            予約に戻る
          </Link>
        )}
        <button
          onClick={handleCancel}
          className="flex items-center gap-1 rounded-full border border-white/40 px-3 py-1 text-xs font-bold text-white/80 hover:bg-white/10 transition-colors"
          aria-label="仮予約をキャンセル"
        >
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
          キャンセル
        </button>
      </div>
    </div>
  )
}
