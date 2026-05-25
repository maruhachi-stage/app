import {useMemberReservations} from "~/features/member/useMemberReservations"
import {formatJst} from "~/entities/ticket"
import {Link} from "react-router"

export default function MemberReservationsPage() {
    const {reservations, loading, error} = useMemberReservations()

    return (
        <div className="py-8">
            <h1 className="mb-8 text-2xl font-black text-foreground">予約履歴</h1>

            {loading ? (
                <div className="py-20 text-center text-muted-foreground">読み込み中...</div>
            ) : error ? (
                <div className="py-20 text-center text-red-600 font-bold">{error}</div>
            ) : reservations.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground">
                    <p>予約履歴はありません。</p>
                    <Link to="/" className="mt-4 inline-block text-red-600 font-bold hover:underline">映画を探す</Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {reservations.map(res => (
                        <Link
                            key={res.reservationCode}
                            to={`/reservations/r/${res.reservationCode}`}
                            className="group flex gap-6 overflow-hidden rounded-app border border-border bg-card p-4 shadow-sm transition-all hover:border-red-200 hover:shadow-md"
                        >
                            <div className="h-32 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                                {res.thumbnailUrl ? (
                                    <img src={res.thumbnailUrl} alt={res.movieTitle}
                                         className="h-full w-full object-cover group-hover:scale-105 transition-transform"/>
                                ) : (
                                    <div
                                        className="flex h-full items-center justify-center text-[10px] font-bold text-muted-foreground uppercase">No
                                        Image</div>
                                )}
                            </div>

                            <div className="flex flex-1 flex-col justify-between py-1">
                                <div>
                                    <div className="flex items-center justify-between">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          res.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                              res.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'
                      }`}>
                        {res.status === 'confirmed' ? '予約完了' : res.status === 'pending' ? '仮予約' : 'キャンセル済み'}
                      </span>
                                        <span
                                            className="text-[10px] font-bold text-muted-foreground">注文番号: {res.reservationCode}</span>
                                    </div>
                                    <h2 className="mt-2 text-lg font-black text-foreground line-clamp-1">{res.movieTitle}</h2>
                                    <p className="mt-1 text-sm font-bold text-muted-foreground">
                                        {formatJst(res.startsAt)} 〜 {res.screenName}
                                    </p>
                                </div>

                                <div className="flex items-baseline justify-between">
                                    <span
                                        className="text-xs text-muted-foreground">{new Date(res.createdAt).toLocaleDateString()} 予約</span>
                                    <span className="text-xl font-black text-foreground">{res.totalPrice.toLocaleString()}<span
                                        className="ml-0.5 text-xs">円</span></span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
