import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM_EMAIL ?? 'no-reply@hal-cinema.example.jp'

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY is not set')
  return new Resend(key)
}

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    /*
     * =====================================================================
     * ⚠⚠⚠ DEVELOPMENT DEBUG LOG (INTENTIONAL) ⚠⚠⚠
     * ローカル開発でメール配信基盤なしでもOTP確認できるように明示的に出力している。
     * 本番運用では RESEND_API_KEY を必ず設定し、この分岐に入らないことが前提。
     * もし本番相当環境でこのログが出る場合は設定不備として即時対処すること。
     * =====================================================================
     */
    console.log(`[DEV] OTP for ${to}: ${code}`)
    return
  }
  const resend = getResend()
  await resend.emails.send({
    from: FROM,
    to,
    subject: '【HALシネマ】認証コードのお知らせ',
    text: [
      `認証コード: ${code}`,
      `有効期限: 10分`,
      ``,
      `このコードは送信から10分間有効です。`,
      `お問い合わせ: info@hal-cinema.example.jp`,
    ].join('\n'),
  })
}

export type ReservationEmailParams = {
  to: string
  reservationCode: string
  movieTitle: string
  startsAtJst: string
  endsAtJst: string
  screenName: string
  seatList: string
  totalPrice: number
  qrCodeUrl: string
  reservationDetailUrl: string
}

export async function sendReservationEmail(params: ReservationEmailParams): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV] Reservation email for ${params.to}: ${params.reservationCode}`)
    return
  }
  const text = [
    `この度はHALシネマをご利用いただき、ありがとうございます。`,
    `以下の内容でご予約が完了しました。`,
    ``,
    `━━━━━━━━━━━━━━━━━━`,
    `■ 予約番号: ${params.reservationCode}`,
    `━━━━━━━━━━━━━━━━━━`,
    ``,
    `■ 映画タイトル  : ${params.movieTitle}`,
    `■ 上映日時      : ${params.startsAtJst} 〜 ${params.endsAtJst}（JST）`,
    `■ スクリーン    : ${params.screenName}`,
    ``,
    `■ 座席・券種:`,
    params.seatList,
    ``,
    `■ 合計金額: ${params.totalPrice.toLocaleString()}円`,
    ``,
    `━━━━━━━━━━━━━━━━━━`,
    ``,
    `当日は入場時に予約番号またはQRコードをご提示ください。`,
    ``,
    `QRコード: ${params.qrCodeUrl}`,
    ``,
    `予約の確認・キャンセルはこちら（上映開始30分前まで）:`,
    params.reservationDetailUrl,
    ``,
    `━━━━━━━━━━━━━━━━━━`,
    `HALシネマ`,
    `お問い合わせ: info@hal-cinema.example.jp`,
    `━━━━━━━━━━━━━━━━━━`,
    ``,
    `※このメールは送信専用です。返信はお受けできません。`,
  ].join('\n')

  const resend = getResend()
  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: '【HALシネマ】ご予約完了のお知らせ',
    text,
  })
}
