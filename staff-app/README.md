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

標準の開発 URL は `http://localhost:5174` です。バックエンドは `http://localhost:3000` で起動してください。

## 認証

ユーザーIDとパスワードを検証したあと、登録済みメールアドレスへ6桁のOTPを送信します。
開発環境では `RESEND_API_KEY` 未設定時にバックエンドのコンソールへOTPが出力されます。
セッションは `HttpOnly` Cookie（`hal_staff_session`）で保持します。

初期アカウントはバックエンドで作成します。

```bash
cd ../back-api
npm run db:bootstrap-staff
```

## API prefix

`VITE_API_VERSION` で API 接頭辞を切り替えます。既定は `v1`（`/api/v1`）で、`legacy` を指定すると `/api` を使用します。

## Validation

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
```
