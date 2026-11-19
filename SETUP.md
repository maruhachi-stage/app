# SETUP

## 必須環境

- Node.js 22.5 以上
- npm 10 以上
- Git for Windows（Windowsの場合）
- Cloudflare へデプロイする場合は Cloudflare アカウント（`npx wrangler login`）

apiのCIはNode.js 26で実行します。ほかのアプリは現在のCI Node.jsバージョンを使用します。

## プロジェクト構成

- `user` : React Router v7 フロントエンド（Cloudflare Pages / SPA）
- `staff` : React Router v7 スタッフ画面（Cloudflare Pages / SPA）
- `api` : Hono API + Drizzle ORM（Cloudflare Workers + D1 + R2）
- 画像 : R2（`apps/api/assets/images` を `scripts/images.mjs` で同期し、API Worker の `/images/*` が配信）

## 初回セットアップ

PowerShellでnpmの実行ポリシーエラーが出る場合は、`npm` の代わりに `npm.cmd` を使ってください。

```powershell
cd apps/user
npm.cmd install

cd ../staff
npm.cmd install

cd ../api
npm.cmd install
npm.cmd run db:setup
npm.cmd run images:local
```

`db:setup` は Drizzle のマイグレーション生成 → `d1/migrations` への書き出し → ローカル D1 への適用 → `d1/seed.sql` の投入をまとめて実行します。ローカル D1 は `.wrangler/state` に作成されるため、DB用Dockerや外部DBの起動は不要です。

`images:local` は `assets/images` の画像を Miniflare のローカル R2 へ投入します。画像は Git 管理外なので、新しく clone した環境では R2 から `npm.cmd run images:pull` で取得してから実行してください（何度実行しても同じ結果になります）。

マスタデータを変更した場合は `src/infrastructure/database/seed-data.ts` を編集し、`npm.cmd run db:seed:export` で `d1/seed.sql` を再生成してください（`d1/seed.sql` は自動生成ファイルのため手で編集しません）。

スタッフ画面のログインに使う初期アカウントは、migration適用後に作成します。

```powershell
cd apps/api
npm.cmd run db:bootstrap-staff
```

ユーザーID、表示名、メールアドレス、12文字以上のパスワード、ロールID（10:閲覧者 / 20:編集者 / 99:管理者）を入力すると、`wrangler d1 execute` で流すための INSERT 文が出力されます。ローカルなら `--local`、本番なら `--remote` を付けて実行します。

## 起動方法

### 開発用ポート

| アプリ | ポート | URL |
| --- | --- | --- |
| user | 3030 | `http://localhost:3030` |
| staff | 3040 | `http://localhost:3040` |
| api | 3080 | `http://localhost:3080` |

画像（`/images/*`）も API Worker が提供するため、ローカルで開くアプリはこの3つだけです。

### 別端末（スマホ等）から試す

Tailscale 経由で公開する場合は、3つのポートをそれぞれ `tailscale serve` で公開します（Vite の `allowedHosts` に `.ts.net` を含めてあるため、そのまま開けます）。

```powershell
tailscale serve --bg --https=443  http://127.0.0.1:3030   # user
tailscale serve --bg --https=8443 http://127.0.0.1:3040   # staff
tailscale serve --bg --https=9443 http://127.0.0.1:3080   # api（/api/docs など）
```

`https://<host>.<tailnet>.ts.net/` を開けば user、`:8443` で staff、`:9443` で API のドキュメントを確認できます。`/api/*` と `/images/*` は Vite の proxy で 3080 に転送されるため、追加設定は不要です。

### api

```powershell
cd apps/api
npm.cmd run dev
```

- 起動 URL: `http://localhost:3080`（`wrangler dev` + ローカル D1 / R2）
- Swagger UI: `http://localhost:3080/api/docs`
- OpenAPI JSON: `http://localhost:3080/api/openapi.json`
- スケジュール生成（Cron）の手動実行: `npm.cmd run schedules:local`（別ターミナルで実行）

ローカルでは `wrangler dev` が `wrangler.jsonc` の `[vars]` と `.dev.vars` を読み込みます。`wrangler.jsonc` の `[vars]` は本番値なので、ローカル専用の値は `.dev.vars` にだけ書きます（`.dev.vars.example` をコピーして作成）。画像もローカル R2 から配信されるため、API 以外に起動するプロセスはありません。

上映スケジュールはマスタではなく実行時生成のデータなので、初回は次のコマンドで生成します（未実行だと一覧が空に見えます）。本番では Cron Triggers が毎日 0:00 JST に同じ処理を実行します。

```powershell
# 別ターミナルで（api が起動している状態で）
npm.cmd run schedules:local
```

### user / staff

各ディレクトリで依存関係をインストールしてから開発サーバーを起動します。Vite の proxy 設定により `/api` と `/images` は `http://localhost:3080` へ転送されるため、画像も本番と同じように API Worker から配信されます。

```powershell
cd apps/user
npm.cmd run dev
```

```powershell
cd apps/staff
npm.cmd run dev
```

### api Test

```powershell
cd apps/api
npm.cmd test
```

`@cloudflare/vitest-plugin` によりユニットテストと結合テストの両方が Workers ランタイム上で実行され、`d1/migrations` の適用と `d1/seed.sql` の投入を行ったうえで `SELF.fetch` で API を検証します。ローカルの `wrangler dev` を起動しておく必要はありません。

## Cloudflare デプロイ

デプロイはすべて `wrangler` 経由です。`wrangler login` などのアカウント認証は各自の環境で実行してください。

### 1. リソース作成

```powershell
cd apps/api
npx wrangler login

# D1
npx wrangler d1 create hal-cinema
# 表示された database_id を wrangler.jsonc の d1_databases[0].database_id に設定する

# R2（非公開バケット）
npx wrangler r2 bucket create hal-cinema-images
```

### 2. スキーマ適用

```powershell
cd apps/api
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

`wrangler.jsonc` の `[vars]` は **本番値**です。ローカル開発用の値は `.dev.vars` にだけ書いてください（`.dev.vars.example` をコピー）。

| 変数 | 本番の例 | 用途 |
| --- | --- | --- |
| `ENVIRONMENT` | `production` | セッション Cookie の `Secure` 判定 |
| `CORS_ORIGIN` | `https://hal-cinema-web.pages.dev,https://hal-cinema-staff.pages.dev` | CORS 許可オリジン |
| `RESEND_FROM_EMAIL` | `no-reply@example.jp` | 送信元 |

画像 URL は `/images/<ファイル名>` の相対パスで返すため、画像用のオリジン設定はありません。予約メールのリンクもリクエスト元のオリジンから組み立てます。

シークレットはリポジトリへ含めず、次で登録します。

```powershell
npx wrangler secret put RESEND_API_KEY
```

### 6. 画像の R2 移設

R2 の S3 API トークン（アクセスキー / シークレット）を用意し、環境変数で渡します。既存キーはスキップされるため、何度実行しても安全です。

```powershell
cd apps/api
$env:R2_ACCOUNT_ID="<account-id>"
$env:R2_ACCESS_KEY_ID="<access-key>"
$env:R2_SECRET_ACCESS_KEY="<secret-key>"
$env:R2_BUCKET_NAME="hal-cinema-images"
npm.cmd run images:push
```

`images:push` は `apps/api/assets/images` を R2 へアップロードします（既存キーはスキップ）。画像の実体は Git 管理外なので、環境を作り直すときは `npm.cmd run images:pull` で R2 から取得できます。

### 7. デプロイ

```powershell
# API Worker
cd apps/api
npm.cmd run deploy

# user
cd ../user
npx wrangler pages deploy

# staff
cd ../staff
npx wrangler pages deploy
```

`user` / `staff` の `wrangler.toml` にある `API_ORIGIN` は、デプロイした Worker のオリジンへ置き換えてから Pages をデプロイしてください。各 Pages の `/api/*` と `/images/*` は Pages Functions が同一オリジンのまま Worker へ転送するため、セッション Cookie は `SameSite=Lax` のまま機能し、画像も Pages のオリジンから配信されます。

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

## IDE 実行構成

### JetBrains（IntelliJ IDEA / WebStorm など）

`.run/` に共有用の実行構成を置いています。初回は次の順で実行してください。

1. `setup (db + images)` … 初回のみ。migration + seed の適用と `assets/images` のローカル R2 投入をまとめて実行
2. `all dev` … `api dev` / `user dev` / `staff dev` をまとめて起動
3. `schedules:local` … 上映スケジュールを生成（`api dev` 起動中に実行）

| 実行構成 | 内容 |
| --- | --- |
| `setup (db + images)` | `npm run setup`（`db:setup` + `images:local`、初回のみ） |
| `all dev` | 3アプリの開発サーバーを同時起動（compound） |
| `api dev` | `npm run dev`（`wrangler dev` + ローカル D1 / R2、`http://localhost:3080`） |
| `user dev` | `npm run dev`（`http://localhost:3030`） |
| `staff dev` | `npm run dev`（`http://localhost:3040`） |
| `db:setup` | `npm run db:setup`（generate → migrations export → local apply → seed） |
| `images:local` | `npm run images:local`（`assets/images` → ローカル R2） |
| `schedules:local` | `npm run schedules:local`（Cron ハンドラを手動実行） |
| `api test` | `npm test`（Workers ランタイム上のユニット + 結合） |

画像配信は API Worker の `/images/*`（R2）に一本化したため、`image-server` の実行構成は削除しました。`db:up` / `db:down` / `db:reset` も、ローカル D1（`wrangler dev` が起動する Miniflare）に置き換わったため廃止しています。

### VS Code

`.vscode/launch.json` の `user dev`、`api dev`、`staff dev`、`all dev` から起動できます。`db:setup` はapiのmigrationとseedを適用し、`images:local` は画像をローカル R2 へ投入します。`schedules:local` は上映スケジュールを生成します（`api dev` 起動中に実行）。

## 推奨拡張

- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- GitLens (`eamodio.gitlens`)
- EditorConfig (`editorconfig.editorconfig`)
