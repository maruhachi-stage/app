# HAL Cinema Staff Web

映画館スタッフ向けの内部Webアプリケーションです。React Router v7、TypeScript、Tailwind CSSで構成しています。

## 開発

```bash
npm install
npm run dev
```

バックエンドは `http://localhost:3000` で起動してください。

## 認証

ユーザーID、パスワード、メールOTPでログインします。開発環境では、送信OTPをバックエンドのコンソールでも確認できます。本番環境ではOTP値をログ出力しません。

## API接頭辞

`VITE_API_VERSION` を利用します。既定は `v1`（`/api/v1`）です。`legacy` を指定すると `/api` を使用します。

## 検証

```bash
npm run typecheck
npm run build
```
