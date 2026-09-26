# back-api

Hono + Drizzle ORMを使ったAPIです。開発データベースにはNode.js標準の `node:sqlite` とローカルSQLiteファイルを使用します。DB用Dockerや外部DBの起動は不要です。

## 開発開始

```bash
npm install
npm run db:migrate
npm run dev
```

既定のDBファイルは `data/app.db` です。`DB_FILE=./data/app.db` で変更できます。親ディレクトリとDBファイルはmigration時に自動作成されます。

## Database scripts

- `npm run db:migrate`: SQLite DBを作成し、未適用migrationを適用
- `npm run db:reset`: DBとWAL/SHM/journalを削除し、再作成して全migrationを適用
- `npm run db:seed`: 初期データをseed
- `npm run db:setup`: migration適用後にseed
- `npm run db:generate`: schemaからmigration生成
- `npm run db:check`: migration journalを確認

`db:migrate` は何度実行しても未適用分だけを適用します。

## Integration Test

```bash
npm run test:integration
```

Integration Testは `DB_TEST_FILE`（既定値 `./data/test.db`）を使用します。実行スクリプトがテストDBを初期化してmigrationを適用し、テスト終了時にDBとsidecarファイルを削除します。開発用の `app.db` は使用しません。

## API docs

サーバー起動中はSwagger UIを `http://localhost:3000/api/docs`、OpenAPI JSONを `http://localhost:3000/api/openapi.json` で確認できます。
