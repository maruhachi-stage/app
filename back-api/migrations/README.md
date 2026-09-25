# Database migrations

このディレクトリのSQLは、Drizzleが管理する順番付きの差分Migrationです。

## ルール

- Migrationは`back-api/migrations/`直下に置く。
- ファイル名はDrizzleの形式（`0001_<変更内容>.sql`）とし、`npm run db:generate`で作成する。
- 既に適用されたSQL、`meta/`配下のスナップショット、`legacy/001_init.sql`は変更しない。
- Schemaを変更するときは、先に`src/infrastructure/database/schema.ts`を更新し、差分Migrationを生成する。
- 生成されたSQLを確認してからコミットする。不要なDROPやデータ削除が含まれる場合は、そのまま適用しない。

## 追加と適用

```powershell
cd back-api
npm.cmd run db:generate
npm.cmd run db:check
npm.cmd run db:migrate
```

`db:migrate`はMySQLの名前付きロックを取得してからDrizzleを実行します。同時実行時は後から開始した処理が終了コード`2`で停止します。Drizzleは`__drizzle_migrations`で適用済みMigrationを管理するため、再実行時は未適用分だけが順番に適用されます。

初回セットアップでは、MySQLの起動とMigration適用をまとめて実行できます。

```powershell
npm.cmd run db:setup
```

`db:up`はコンテナ起動だけ、`db:migrate`はSchema変更だけを担当します。`db:reset`はボリュームとデータを削除するため、開発環境の初期化が必要な場合に限って使用してください。

## 失敗時とロールバック

Migrationが失敗した場合、コマンドは非ゼロ終了し、後続Migrationは適用しません。エラーログとDBの状態を確認して原因を修正してから、同じMigrationを再実行してください。

MySQLのDDLは文によって暗黙にCommitされるため、Migration全体を自動で元に戻せるとは限りません。適用済みMigrationのSQLを書き換えたり、履歴テーブルを直接変更したりせず、必要ならバックアップを取得したうえで、修復用の新しいMigrationを追加する前方修正を行います。
