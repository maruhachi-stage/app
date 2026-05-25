import {Link} from "react-router"
import {Button} from "~/shared/ui/Button"
import {Input} from "~/shared/ui/Input"
import {formatJst} from "~/entities/ticket"
import {useReservationDetail} from "~/features/reservation/useReservationDetail"
import {useAppConfig} from "~/shared/config"

export default function ReservationDetailPage() {
    const { config } = useAppConfig()
    const {
        detail, notFound, cancelled,
        showCancelModal, setShowCancelModal, closeCancelModal,
        cancelEmail, setCancelEmail, cancelError,
        cancelling, handleCancel,
    } = useReservationDetail()

    if (notFound) {
        return (
            <div className="py-12 text-center">
                <p className="text-lg font-bold">予約が見つかりませんでした</p>
                <Link to="/reservations/lookup" className="mt-4 inline-block text-sm text-blue-600 underline">
                    予約確認ページへ戻る
                </Link>
            </div>
        )
    }

    if (!detail) {
        return (
            <div className="py-12 text-center text-muted-foreground">読み込み中...</div>
        )
    }

    const statusLabel = detail.status === "confirmed" ? "予約済み" : "キャンセル済み"
    const statusColor = detail.status === "confirmed" ? "text-green-600" : "text-red-500"

    return (
        <div className="py-8 max-w-xl mx-auto">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground">予約詳細</h1>
                <span className={`text-sm font-bold ${statusColor}`}>{statusLabel}</span>
            </div>

            {cancelled && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">予約をキャンセルしました。</div>
            )}

            <div className="mb-4 rounded-lg border border-border p-4 text-center">
                <p className="text-xs text-muted-foreground">予約番号</p>
                <p className="mt-1 text-2xl font-bold tracking-widest">{detail.reservationCode}</p>
            </div>

            {detail.qrCodeUrl && (
                <div className="mb-4 flex flex-col items-center rounded-lg border border-border p-4">
                    <p className="mb-2 text-sm text-muted-foreground">QRコード（入場時にご提示ください）</p>
                    <img src={detail.qrCodeUrl} alt="QRコード" className="h-40 w-40 rounded"/>
                </div>
            )}

            <section className="mb-4 rounded-app border border-border bg-card p-5 shadow-sm">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">上映情報</h2>
                <div className="flex gap-4">
                    {detail.movie.thumbnailUrl && (
                        <img src={detail.movie.thumbnailUrl} alt={detail.movie.title}
                             className="h-20 w-14 rounded-lg object-cover"/>
                    )}
                    <div>
                        <p className="font-black text-foreground">{detail.movie.title}</p>
                        <p className="mt-1 text-sm font-bold text-muted-foreground">{formatJst(detail.schedule.startsAt)}</p>
                        <p className="text-sm text-muted-foreground">{detail.schedule.screenName}</p>
                    </div>
                </div>
            </section>

            <section className="mb-4 rounded-app border border-border bg-card p-5 shadow-sm">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">座席・券種</h2>
                <table className="w-full text-sm">
                    <tbody>
                    {detail.seats.map((s, i) => {
                        const t = config?.tickets.find((t) => t.type === s.ticketType)
                        const label = t?.label ?? s.ticketType
                        return (
                        <tr key={i} className="border-b border-border last:border-0">
                            <td className="py-2 font-black text-foreground">{s.row}-{s.col}</td>
                            <td className="py-2 text-muted-foreground">{label}</td>
                            <td className="py-2 text-right font-bold text-foreground">{s.price.toLocaleString()}円</td>
                        </tr>
                        )
                    })}
                    </tbody>
                </table>
                <div className="mt-3 flex justify-between border-t border-border pt-3 font-black text-foreground">
                    <span>合計</span><span>{detail.totalPrice.toLocaleString()}円</span>
                </div>
            </section>

            <section className="mb-6 rounded-app border border-border bg-card p-5 shadow-sm">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">お客様情報</h2>
                <p className="text-sm text-foreground"><span
                    className="font-bold text-muted-foreground">メール</span> {detail.customer.maskedEmail}</p>
            </section>

            <div className="flex flex-col gap-3">
                {detail.canCancel && (
                    <Button size="md" variant="secondary"
                            onClick={() => setShowCancelModal(true)}>予約をキャンセルする</Button>
                )}
                <Link to="/movies">
                    <Button size="md" variant="ghost" className="w-full">映画一覧へ</Button>
                </Link>
            </div>

            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
                        <h2 className="mb-3 text-lg font-bold">予約をキャンセルしますか？</h2>
                        <p className="mb-4 text-sm text-gray-600">キャンセル後は元に戻せません。本当にキャンセルしますか？</p>
                        <div className="mb-4">
                            <Input id="cancelEmail" type="email" label="予約時のメールアドレスを入力して確認"
                                   value={cancelEmail} onChange={e => setCancelEmail(e.target.value)}
                                   placeholder="example@email.com" autoComplete="email"/>
                        </div>
                        {cancelError && <p className="mb-3 text-sm text-red-600">{cancelError}</p>}
                        <div className="flex gap-3">
                            <Button size="md" variant="ghost" className="flex-1"
                                    onClick={closeCancelModal}>戻る</Button>
                            <Button size="md" variant="secondary" className="flex-1" disabled={cancelling}
                                    onClick={handleCancel}>
                                {cancelling ? "処理中..." : "キャンセルする"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
