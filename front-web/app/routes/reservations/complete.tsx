import { Link } from "react-router"
import { Button } from "~/shared/ui/Button"
import { useComplete } from "~/features/reservation/useComplete"

export default function CompletePage() {
  const { result } = useComplete()

  return (
    <div className="py-12 text-center">
      <div className="mb-4 text-5xl">🎉</div>
      <h1 className="mb-2 text-2xl font-bold">予約完了</h1>
      <p className="mb-8 text-sm text-gray-500">
        ご予約ありがとうございます。<br />
        当日は入場時に予約番号またはQRコードをご提示ください。
      </p>

      {result ? (
        <div className="rounded-lg border border-gray-200 p-6 text-left mb-6">
          <p className="text-xs text-gray-500 text-center">予約番号</p>
          <p className="mt-1 text-3xl font-bold tracking-widest text-center">{result.reservationCode}</p>
          <p className="mt-4 text-xs text-gray-500 text-center">合計金額</p>
          <p className="mt-1 text-xl font-bold text-center">{result.totalPrice.toLocaleString()}円</p>
          {result.qrCodeUrl && (
            <div className="mt-4 text-center">
              <p className="mb-2 text-sm text-gray-500">QRコード（入場時にご提示ください）</p>
              <img src={result.qrCodeUrl} alt="QRコード" className="mx-auto h-40 w-40 rounded" />
            </div>
          )}
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {result && (
          <Link to={`/reservations/r/${result.reservationCode}`}>
            <Button size="md" variant="secondary" className="w-full">予約詳細を確認する</Button>
          </Link>
        )}
        <Link to="/reservations/lookup">
          <Button size="md" variant="secondary" className="w-full">予約を照会する</Button>
        </Link>
        <Link to="/movies">
          <Button size="md" variant="ghost" className="w-full">映画一覧へ戻る</Button>
        </Link>
      </div>
    </div>
  )
}
