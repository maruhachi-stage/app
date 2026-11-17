# SETUP

## 必須環境

- Node.js 22.5 以上
- npm 10 以上
- Git for Windows（Windowsの場合）
- Cloudflare へデプロイする場合は Cloudflare アカウント（`npx wrangler login`）

back-apiのCIはNode.js 26で実行します。ほかのアプリは現在のCI Node.jsバージョンを使用します。

## プロジェクト構成

- `front-web` : React Router v7 フロントエンド（Cloudflare Pages / SPA）
- `staff-app` : React Router v7 スタッフ画面（Cloudflare Pages / SPA）
- `back-api` : Hono API + Drizzle ORM（Cloudflare Workers + D1 + R2）
- `image-server` : ローカル開発用の画像配信（本番は R2 + Worker の `/images/*`）

## 初回セットアップ

PowerShellでnpmの実行ポリシーエラーが出る場合は、`npm` の代わりに `npm.cmd` を使ってください。

```powershell
cd front-web
npm.cmd install

cd ../staff-app
npm.cmd install

cd ../back-api
npm.cmd install
npm.cmd run db:setup
```

`db:setup` は Drizzle のマイグレーション生成 → `d1/migrations` への書き出し → ローカル D1 への適用 → `d1/seed.sql` の投入をまとめて実行します。ローカル D1 は `.wrangler/state` に作成されるため、DB用Dockerや外部DBの起動は不要です。

マスタデータを変更した場合は、ローカルの旧 SQLite（`data/app.db`）を更新したうえで `npm.cmd run db:seed:export` を実行し、`d1/seed.sql` を再生成してください（自動生成ファイルのため手で編集しません）。

スタッフ画面のログインに使う初期アカウントは、migration適用後に作成します。

```powershell
cd back-api
npm.cmd run db:bootstrap-staff
```

ユーザーID、表示名、メールアドレス、12文字以上のパスワード、ロールID（10:閲覧者 / 20:編集者 / 99:管理者）を入力すると、`wrangler d1 execute` で流すための INSERT 文が出力されます。ローカルなら `--local`、本番なら `--remote` を付けて実行します。

## 起動方法

### 開発用ポート

| アプリ | ポート | URL |
| --- | --- | --- |
| front-web | 3030 | `http://localhost:3030` |
| staff-app | 3040 | `http://localhost:3040` |
| back-api | 3080 | `http://localhost:3080` |
| image-server | 3090 | `http://localhost:3090` |

### back-api

```powershell
cd back-api
npm.cmd run dev
```

- 起動 URL: `http://localhost:3080`（`wrangler dev` + ローカル D1 / R2）
- Swagger UI: `http://localhost:3080/api/docs`
- OpenAPI JSON: `http://localhost:3080/api/openapi.json`
- スケジュール生成（Cron）の手動実行: `curl http://localhost:3080/cdn-cgi/local/scheduled`

ローカルでは `wrangler dev` が `wrangler.jsonc` の `[vars]` と `.dev.vars`（または `.env`）を読み込みます。ローカル開発時の画像は `image-server`（`http://localhost:3090`）を参照するため、R2 への一括投入は不要です。

### front-web / staff-app

各ディレクトリで依存関係をインストールしてから開発サーバーを起動します。Vite の proxy 設定により `/api` は `http://localhost:3080` へ転送されます。

```powershell
cd front-web
npm.cmd run dev
```

```powershell
cd staff-app
npm.cmd run dev
```

### back-api Integration Test

```powershell
cd back-api
npm.cmd run test:integration
```

`@cloudflare/vitest-plugin` により Workers ランタイム上で実行され、`d1/migrations` の適用と `d1/seed.sql` の投入を行ったうえで `SELF.fetch` で API を検証します。ローカルの `wrangler dev` を起動しておく必要はありません。

## Cloudflare デプロイ

デプロイはすべて `wrangler` 経由です。`wrangler login` などのアカウント認証は各自の環境で実行してください。

### 1. リソース作成

```powershell
cd back-api
npx wrangler login

# D1
npx wrangler d1 create hal-cinema
# 表示された database_id を wrangler.jsonc の d1_databases[0].database_id に設定する

# R2（非公開バケット）
npx wrangler r2 bucket create hal-cinema-images
```

### 2. スキーマ適用

```powershell
cd back-api
npm.cmd run db:generate          # schema.ts を変更したときのみ
npm.cmd run db:migrations:export # drizzle-kit の出力を d1/migrations へ
npx wrangler d1 migrations apply hal-cinema --remote
```

### 3. マスタデータ投入

```powershell
npm.cmd run db:seed:remote
```

### 4. 初期スタッフアカウント

```powershell
npm.cmd run db:bootstrap-staff
# 出力された SQL を --remote で実行する
npx wrangler d1 execute hal-cinema --remote --file=<出力したSQLファイル>
```

### 5. 環境変数とシークレット

`wrangler.jsonc` の `[vars]` を本番値へ変更します。

| 変数 | 本番の例 | 用途 |
| --- | --- | --- |
| `ENVIRONMENT` | `production` | セッション Cookie の `Secure` 判定 |
| `CORS_ORIGIN` | `https://hal-cinema-web.pages.dev,https://hal-cinema-staff.pages.dev` | CORS 許可オリジン |
| `IMAGE_BASE_URL` | `https://hal-cinema-api.<subdomain>.workers.dev` | 画像URLの基点 |
| `BASE_URL` | `https://hal-cinema-web.pages.dev` | 予約詳細URLの基点 |
| `RESEND_FROM_EMAIL` | `no-reply@example.jp` | 送信元 |

シークレットはリポジトリへ含めず、次で登録します。

```powershell
npx wrangler secret put RESEND_API_KEY
```

### 6. 画像の R2 移設

R2 の S3 API トークン（アクセスキー / シークレット）を用意し、環境変数で渡します。既存キーはスキップされるため、何度実行しても安全です。

```powershell
cd back-api
$env:R2_ACCOUNT_ID="<account-id>"
$env:R2_ACCESS_KEY_ID="<access-key>"
$env:R2_SECRET_ACCESS_KEY="<secret-key>"
$env:R2_BUCKET_NAME="hal-cinema-images"
npm.cmd run images:upload
```

### 7. デプロイ

```powershell
# API Worker
cd back-api
npm.cmd run deploy

# front-web
cd ../front-web
npx wrangler pages deploy

# staff-app
cd ../staff-app
npx wrangler pages deploy
```

`front-web` / `staff-app` の `wrangler.toml` にある `API_ORIGIN` は、デプロイした Worker のオリジンへ置き換えてから Pages をデプロイしてください。各 Pages の `/api/*` は Pages Functions が同一オリジンのまま Worker へ転送するため、セッション Cookie は `SameSite=Lax` のまま機能します。

### 8. スモークテスト

- `GET /api/v1/health` が 200
- `GET /api/movies` が 200 で一覧が返る
- `GET /images/<ファイル名>` が 200 と `Cache-Control: public, max-age=31536000, immutable`
- `https://hal-cinema-web.pages.dev` で一覧 → 座席指定 → 予約が完了する
- `https://hal-cinema-staff.pages.dev` でログイン（OTP）後、リロードしてもセッションが維持される

### 既知の制約

- **Workers 有料プランを前提**としています。スタッフのパスワードは `node:crypto` の scrypt で検証するため、無料枠の CPU 上限（10ms）を超える可能性があります。
- レート制限（`checkRateLimit`）は isolate 単位のメモリで動作するため、複数 isolate に分散すると実効的な制限は緩くなります。
- D1 は単一プライマリのため書き込みは直列化されます。座席の二重予約は `batch` + 一意制約で防いでいますが、厳密なロックが必要になった場合は Durable Object を検討してください。

## VS Code

`.vscode/launch.json` の `front-web run`、`back-api run`、`staff-app run`、`all dev` から起動できます。`db:setup` はback-apiのmigrationとseedを適用します。

## 推奨拡張

- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- GitLens (`eamodio.gitlens`)
- EditorConfig (`editorconfig.editorconfig`)
