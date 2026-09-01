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
