import { useNavigate } from 'react-router'
import { Button } from '~/components/Button'
import { useBooking } from '~/features/reservation/useBooking'
import { SeatMap } from '~/components/SeatMap'
import { DateSelector } from '~/components/DateSelector'
import { ScheduleGrid } from '~/components/ScheduleGrid'
import { ScreeningHeroBanner } from '~/components/ScreeningHeroBanner'
import { getAuthState } from '~/lib/api/auth'
import { apiFetch } from '~/lib/api-client'
import { useReservationFlow } from '~/components/ReservationFlowProvider'
import { ReservationActionBar } from '~/components/ReservationActionBar'

export default function BookingPage() {
    const navigate = useNavigate()
    const { setBookingType, setCustomer } = useReservationFlow()
    const {
        movie,
        days,
        selectedDate,
        setSelectedDate,
        schedules,
        selectedScheduleId,
        setSelectedScheduleId,
        mapData,
        mapLoading,
        selectedSeatIds,
        toggleSeat,
        loading,
        error,
        toastMsg,
        holdSeats,
        retryLoad,
    } = useBooking()

    async function handleNext() {
        const success = await holdSeats()
        if (!success) return
        const auth = await getAuthState()
        if (auth.authenticated) {
            setBookingType('member')
            try {
                const profile = await apiFetch<{ email: string }>('/members/profile')
                setCustomer({ email: profile.email })
            } catch {}
            navigate('/reservations/tickets')
        } else {
            navigate('/reservations/entry')
        }
    }

    if (loading) return <div className="py-20 text-center text-muted-foreground">読み込み中...</div>
    if (error) {
        return (
            <div className="py-20 text-center">
                <p className="font-bold text-primary">{error}</p>
                <Button className="mt-6" onClick={retryLoad}>
                    再試行
                </Button>
            </div>
        )
    }

    return (
        <div className="py-6">
            {movie && (
                <ScreeningHeroBanner
                    title={movie.title}
                    posterUrl={movie.thumbnailUrl}
                    meta={<>{movie.durationMin}分</>}
                />
            )}

            <div className="mt-6">
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                    1. 日付を選択
                </h2>
                <div className="mb-3 mt-2">
                    <button
                        onClick={() => setSelectedDate('')}
                        className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                            !selectedDate
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                    >
                        すべて
                    </button>
                </div>
                <DateSelector days={days} selectedDate={selectedDate} onSelect={setSelectedDate} />
            </div>

            {selectedDate && (
                <div className="mt-8">
                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                        2. 時間を選択
                    </h2>
                    <div className="mt-3">
                        {schedules.length > 0 ? (
                            movie && (
                                <ScheduleGrid
                                    schedules={schedules}
                                    itemId={movie.id}
                                    selectedDate={selectedDate}
                                    selectedScheduleId={selectedScheduleId ?? undefined}
                                    onSelect={setSelectedScheduleId}
                                />
                            )
                        ) : (
                            <p className="text-sm text-muted-foreground italic">
                                この日の上映予定はありません。
                            </p>
                        )}
                    </div>
                </div>
            )}

            {selectedScheduleId && (
                <div
                    className={`mt-10 border-t border-border pt-10 ${selectedSeatIds.length > 0 ? 'pb-28 sm:pb-0' : ''}`}
                >
                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                        3. 座席を選択
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">最大8席まで選択できます</p>

                    {mapData && (
                        <SeatMap
                            mapData={mapData}
                            mapLoading={mapLoading}
                            selectedSeatIds={selectedSeatIds}
                            toggleSeat={toggleSeat}
                        />
                    )}

                    {selectedSeatIds.length > 0 && (
                        <ReservationActionBar
                            seats={selectedSeatIds.map((id) => {
                                const s = mapData?.seats.find((x) => x.seatId === id)
                                return { row: s?.row ?? '', col: s?.col ?? '' }
                            })}
                            onNext={handleNext}
                        />
                    )}
                </div>
            )}

            {toastMsg && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 rounded-full bg-secondary/90 px-6 py-3 text-sm font-bold text-foreground shadow-2xl backdrop-blur-md transition-all animate-bounce">
                    {toastMsg}
                </div>
            )}
        </div>
    )
}
