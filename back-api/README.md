# back-api

Hono + Drizzle ORMを使ったAPIです。Cloudflare Workers上で動作し、データベースはD1、画像はR2を使います。ローカル開発も `wrangler dev` によるエミュレーション（ローカルD1 / R2）で行うため、DB用Dockerや外部DBの起動は不要です。

## 開発開始

```bash
npm install
npm run db:setup
npm run dev
```

- `npm run dev` は `wrangler dev` を起動します（`http://localhost:3080`）
- ローカルD1は `.wrangler/state` に作成されます
- 画像はローカル開発時のみ `image-server`（`http://localhost:3090`）を参照します
- Cronによるスケジュール生成は手動実行できます: `curl http://localhost:3080/cdn-cgi/local/scheduled`

変数は `wrangler.jsonc` の `[vars]`、シークレットは `.dev.vars`（`.dev.vars.example` を参照）で管理します。どちらもリポジトリへは含めません。

## Database scripts

- `npm run db:setup`: migration生成 → `d1/migrations` へ書き出し → ローカルD1へ適用 → seed投入
- `npm run db:generate`: Drizzle schemaからmigration生成（`migrations/`）
- `npm run db:migrations:export`: drizzle-kitの出力を `d1/migrations/*.sql` へ書き出し
- `npm run db:migrations:local` / `db:migrations:remote`: `wrangler d1 migrations apply`
- `npm run db:seed:export`: ローカルSQLiteのマスタデータから `d1/seed.sql` を生成
- `npm run db:seed:local` / `db:seed:remote`: `d1/seed.sql` を投入
- `npm run db:bootstrap-staff`: 初期スタッフアカウントのINSERT文を出力
- `npm run db:check`: migration journalを確認

スキーマの正は `src/infrastructure/database/schema.ts` と `migrations/` です。生SQLは手で書かず、`db:generate` → `db:migrations:export` → `wrangler d1 migrations apply` の一方向で適用します。

## Images

```bash
npm run images:upload
```

`image-server/images` の画像をR2へ投入します。`R2_ACCOUNT_ID`、`R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`、`R2_BUCKET_NAME` が必要です。既存キーはスキップするため冪等です。配信はWorkerの `GET /images/*` が担当し、R2の公開URLは使いません。

## Integration Test

```bash
npm run test:integration
```

`@cloudflare/vitest-plugin` によりWorkersランタイム上で実行されます。`d1/migrations` の適用と `d1/seed.sql` の投入を行い、`SELF.fetch` でAPIを検証するため、別途サーバーを起動する必要はありません。

## Deploy

```bash
npm run deploy
```

事前にD1 / R2の作成、`wrangler secret put RESEND_API_KEY`、`[vars]` の本番値への更新が必要です。手順の全体はリポジトリ直下の `SETUP.md` を参照してください。

## API docs

サーバー起動中はSwagger UIを `http://localhost:3080/api/docs`、OpenAPI JSONを `http://localhost:3080/api/openapi.json` で確認できます。
