```
npm install
npm run dev
```

```
open http://localhost:3000
```

## APIドキュメント

サーバー起動中は、Swagger UIを`http://localhost:3000/api/docs`で確認できます。OpenAPI JSONは`http://localhost:3000/api/openapi.json`から取得できます。

初回起動時は、MySQLとmigrationをまとめて準備できます。

```powershell
npm.cmd run db:setup
npm.cmd run dev
```
