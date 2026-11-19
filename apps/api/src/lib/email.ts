import { Resend } from 'resend'

/** Credentials come from the Worker bindings, so nothing is read from `process.env`. */
export type EmailConfig = {
  apiKey?: string
  from: string
}

function getResend(config: EmailConfig): Resend {
  if (!config.apiKey) throw new Error('RESEND_API_KEY is not set')
  return new Resend(config.apiKey)
}

export async function sendOtpEmail(
  config: EmailConfig,
  to: string,
  code: string,
  purpose?: string,
): Promise<void> {
  if (!config.apiKey) {
    /*
     * =====================================================================
     * ⚠⚠⚠ DEVELOPMENT DEBUG LOG (INTENTIONAL) ⚠⚠⚠
     * ローカル開発でメール配信基盤なしでもOTP確認できるように明示的に出力している。
     * 本番運用では RESEND_API_KEY を必ず設定し、この分岐に入らないことが前提。
     * もし本番相当環境でこのログが出る場合は設定不備として即時対処すること。
     * =====================================================================
     */
    console.log(`[DEV] OTP for ${to}${purpose ? ` (${purpose})` : ''}: ${code}`)
    return
  }
  const resend = getResend(config)
  await resend.emails.send({
    from: config.from,
    to,
    subject: '【丸八ステージ】認証コードのお知らせ',
    text: [
      `認証コード: ${code}`,
      `有効期限: 10分`,
      ``,
      `このコードは送信から10分間有効です。`,
      `お問い合わせ: info@maruhachi-stage.example`,
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

export async function sendReservationEmail(
  config: EmailConfig,
  params: ReservationEmailParams,
): Promise<void> {
  if (!config.apiKey) {
    console.log(`[DEV] Reservation email for ${params.to}: ${params.reservationCode}`)
    return
  }
  const text = [
    `この度は丸八ステージをご利用いただき、ありがとうございます。`,
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
    `丸八ステージ`,
    `お問い合わせ: info@maruhachi-stage.example`,
    `━━━━━━━━━━━━━━━━━━`,
    ``,
    `※このメールは送信専用です。返信はお受けできません。`,
  ].join('\n')

  const resend = getResend(config)
  await resend.emails.send({
    from: config.from,
    to: params.to,
    subject: '【丸八ステージ】ご予約完了のお知らせ',
    text,
  })
}
