import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { formatJst } from "~/entities/ticket"
import { useTicketSelection } from "~/features/reservation/useTicketSelection"
import { useReservationFlow } from "~/processes/reservation-flow/context"
import { apiFetch } from "~/shared/api/client"
import { useAppConfig } from "~/shared/config"
import { MovieHeroBanner } from "~/widgets/MovieHeroBanner"
import { ReservationActionBar } from "~/widgets/ReservationActionBar"

type ScheduleInfo = {
  scheduleId: number
  movieTitle: string
  screenName: string
  startsAt: string
  endsAt: string
  thumbnailUrl?: string | null
  durationMin?: number
}

export default function TicketsPage() {
  const navigate = useNavigate()
  const { canProceedTo, state } = useReservationFlow()
  const { seats, totalPrice, quoting, updateSeatTicketType, submit } = useTicketSelection()
  const [info, setInfo] = useState<ScheduleInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const { config } = useAppConfig()

  useEffect(() => {
    const result = canProceedTo("tickets")
    if (!result.ok) { navigate(result.redirectTo, { replace: true }); return }

    if (state.scheduleId) {
      apiFetch<ScheduleInfo>(`/schedules/${state.scheduleId}`)
        .then(setInfo)
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  function handleNext() {
    submit()
    navigate("/reservations/payment")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="py-12">
      <div className="text-center mb-10">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Step 3 / 5</p>
        <h1 className="text-3xl font-black tracking-tight">券種選択</h1>
        <p className="mt-2 text-sm text-muted-foreground">座席ごとに券種を選択してください。</p>
      </div>

      {info && (
        <MovieHeroBanner
          title={info.movieTitle}
          posterUrl={info.thumbnailUrl}
          meta={<>{formatJst(info.startsAt)} / {info.screenName}</>}
        />
      )}

      <h2 className="mb-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">券種を選ぶ</h2>

      <div className="flex flex-col gap-4">
        {seats.map(seat => (
          <div key={seat.seatId}
            className="flex flex-col gap-4 rounded-app border border-border bg-card shadow-sm p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-xs font-black text-background">
                {seat.row}-{seat.col}
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">座席</p>
                <p className="text-sm font-black text-foreground">選択済み</p>
              </div>
            </div>
            <div className="flex flex-1 gap-2 sm:max-w-xs">
              {config?.tickets.map(t => (
                <button
                  key={t.type}
                  onClick={() => updateSeatTicketType(seat.seatId, t.type as any)}
                  className={`flex-1 rounded-lg border-2 py-2 text-[10px] font-black transition-all ${
                    seat.ticketType === t.type
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {t.label}<br />{t.price.toLocaleString()}円
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ReservationActionBar
        seats={seats.map(s => ({ row: s.row, col: s.col }))}
        totalPrice={totalPrice}
        quoting={quoting}
        onNext={handleNext}
      />
    </div>
  )
}
