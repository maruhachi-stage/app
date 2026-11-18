# back-api

Hono + Drizzle ORMを使ったAPIです。Cloudflare Workers上で動作し、データベースはD1、画像はR2を使います。ローカル開発も `wrangler dev` によるエミュレーション（ローカルD1 / R2）で行うため、DB用Dockerや外部DBの起動は不要です。

## 開発開始

```bash
npm install
npm run db:setup
npm run images:local
npm run dev
```

- `npm run dev` は `wrangler dev` を起動します（`http://localhost:3080`）
- ローカルD1は `.wrangler/state` に作成されます
- 画像もローカルR2から配信されるため、別プロセスの起動は不要です（API と同じコードが本番と同じように動きます）
- Cronによるスケジュール生成は手動実行できます: `curl http://localhost:3080/cdn-cgi/local/scheduled`

変数は本番値が `wrangler.jsonc` の `[vars]`、ローカル差分だけを `.dev.vars`（`.dev.vars.example` をコピー）で管理します。どちらもリポジトリへは含めません。

## Database scripts

- `npm run db:setup`: migration生成 → `d1/migrations` へ書き出し → ローカルD1へ適用 → seed投入
- `npm run db:generate`: Drizzle schemaからmigration生成（`migrations/`）
- `npm run db:migrations:export`: drizzle-kitの出力を `d1/migrations/*.sql` へ書き出し
- `npm run db:migrations:local` / `db:migrations:remote`: `wrangler d1 migrations apply`
- `npm run db:seed:export`: `src/infrastructure/database/seed-data.ts` から `d1/seed.sql` を生成
- `npm run db:seed:local` / `db:seed:remote`: `d1/seed.sql` を投入
- `npm run db:bootstrap-staff`: 初期スタッフアカウントのINSERT文を出力
- `npm run db:check`: migration journalを確認

スキーマの正は `src/infrastructure/database/schema.ts` と `migrations/`、マスタの正は `src/infrastructure/database/seed-data.ts` です。生SQLは手で書かず、`db:generate` → `db:migrations:export` → `wrangler d1 migrations apply` の一方向で適用します。

## Images

```bash
npm run images:pull   # R2 -> assets/images（初回・環境を作り直したとき）
npm run images:local  # assets/images -> ローカル R2（wrangler dev 用）
npm run images:push   # assets/images -> R2（本番・既存キーはスキップ）
```

`R2_ACCOUNT_ID`、`R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`、`R2_BUCKET_NAME` は push / pull でのみ必要です。画像の実体は Git 管理外（`assets/images`）なので、開発環境では `images:pull` で取得し、`images:local` でローカル R2 へ投入します。

配信は Worker の `GET /images/*` が担当し、R2 の公開 URL は使いません。API レスポンスの画像 URL は `/images/<ファイル名>` の相対パスなので、Pages・`wrangler dev`・本番 Worker のどこでも同じ値が使えます。

## Test

```bash
npm test            # ユニットテスト + 結合テスト
npm run test:integration  # 結合テストのみ
```

`@cloudflare/vitest-plugin` によりどちらもWorkersランタイム上で実行されます。`d1/migrations` の適用と `d1/seed.sql` の投入を行い、`SELF.fetch` でAPIを検証するため、別途サーバーを起動する必要はありません。

## Deploy

```bash
npm run deploy
```

事前にD1 / R2の作成、`wrangler secret put RESEND_API_KEY`、`wrangler.jsonc` の `database_id` と本番 `[vars]` の設定が必要です。手順の全体はリポジトリ直下の `SETUP.md` を参照してください。

## API docs

サーバー起動中はSwagger UIを `http://localhost:3080/api/docs`、OpenAPI JSONを `http://localhost:3080/api/openapi.json` で確認できます。
