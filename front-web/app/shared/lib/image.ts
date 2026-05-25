// 画像プロキシ: モバイルから localhost:3001 に直接アクセスできないためフロントが代理
// 無効にする場合は下の行を false に変えるかコメントアウト
const USE_IMAGE_PROXY = true

export function proxyImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  // USE_IMAGE_PROXY = false の場合はそのまま返す
  if (!USE_IMAGE_PROXY) return url
  return url.replace(/^https?:\/\/localhost:3001/, "/img-proxy")
}
