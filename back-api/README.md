```
npm install
npm run dev
```

```
open http://localhost:3000
```

## Database setup and migrations

初回起動時は、MySQLの起動と未適用Migrationの適用を実行します。

```powershell
npm.cmd run db:setup
```

通常のSchema変更は、`src/infrastructure/database/schema.ts`を更新してから、Migrationを生成・確認・適用します。

```powershell
npm.cmd run db:generate
npm.cmd run db:check
npm.cmd run db:migrate
```

Migrationの命名、適用済み判定、失敗時の扱い、ロールバック方針は[`migrations/README.md`](migrations/README.md)を参照してください。

## Integration Test

Integration Testは、通常の開発用MySQLと分離したポート`3307`のMySQLをDocker Composeで起動して実行します。

```powershell
npm.cmd run db:test:up
npm.cmd run db:test:migrate
npm.cmd run test:integration
npm.cmd run db:test:down
```

テスト用DBを破棄して作り直す場合は`npm.cmd run db:test:reset`を使用してください。CIでも同じ手順を実行します。

## APIドキュメント

サーバー起動中は、Swagger UIを`http://localhost:3000/api/docs`で確認できます。OpenAPI JSONは`http://localhost:3000/api/openapi.json`から取得できます。

初回起動時は、MySQLとmigrationをまとめて準備できます。

```powershell
npm.cmd run db:setup
npm.cmd run dev
```
