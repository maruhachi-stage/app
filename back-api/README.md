```
npm install
npm run dev
```

```
open http://localhost:3000
```

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
