# HAL Cinema Staff Web

映画館スタッフ向けの Web アプリケーションです。React Router v7、TypeScript、TailwindCSS v4 で構成しています。

## 主な画面

- ログイン（ユーザーID・パスワード・メールOTP）
- ダッシュボード
- 座席レイアウト

## Development

```bash
npm install
npm run dev
```

標準の開発 URL は `http://localhost:3040` です。バックエンドは `http://localhost:3080` で起動してください。

## 認証

ユーザーIDとパスワードを検証したあと、登録済みメールアドレスへ6桁のOTPを送信します。
開発環境では `RESEND_API_KEY` 未設定時にバックエンドのコンソールへOTPが出力されます。
セッションは `HttpOnly` Cookie（`hal_staff_session`）で保持します。

初期アカウントはバックエンドで作成します。

```bash
cd ../api
npm run db:bootstrap-staff
```

## API prefix

`VITE_API_VERSION` で API 接頭辞を切り替えます。既定は `v1`（`/api/v1`）で、`legacy` を指定すると `/api` を使用します。

## Deployment

Cloudflare Pages へ **SPA として** 静的配信します（`react-router.config.ts` は `ssr: false`）。

```bash
npm run build
npx wrangler pages deploy
```

- `wrangler.toml` の `pages_build_output_dir` は `build/client`
- `public/_redirects` の `/* /index.html 200` で SPA フォールバック
- `public/_routes.json` で Pages Functions を `/api/*` だけに絞る
- `functions/api/[[path]].ts` は `/api/*` を API Worker（`API_ORIGIN`）へ転送し、ブラウザから見ると同一オリジンのままにする（`SameSite=Lax` のセッション Cookie を維持するため）

デプロイ前に `wrangler.toml` の `API_ORIGIN` を実際の Worker オリジンへ変更してください。

## Validation

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
```
