# SETUP

## 必須環境

- Node.js 22.5 以上（back-apiで標準の `node:sqlite` を使用）
- npm 10 以上
- Git for Windows（Windowsの場合）

back-apiのCIはNode.js 26で実行します。ほかのアプリは現在のCI Node.jsバージョンを使用します。

## プロジェクト構成

- `front-web` : React Router v7 フロントエンド
- `admin-web` : React Router v7 管理画面
- `back-api` : Hono API + Drizzle ORM + ローカルSQLite

## 初回セットアップ

PowerShellでnpmの実行ポリシーエラーが出る場合は、`npm` の代わりに `npm.cmd` を使ってください。

```powershell
cd front-web
npm.cmd install

cd ../admin-web
npm.cmd install

cd ../back-api
npm.cmd install
npm.cmd run db:migrate
```

back-apiは `DB_FILE`（既定値 `./data/app.db`）へSQLiteファイルを自動作成します。DB用Dockerや外部DBの起動は不要です。完全初期化する場合は `npm.cmd run db:reset` を実行してください。

## 起動方法

### back-api

```powershell
cd back-api
npm.cmd run dev
```

- 起動 URL: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/api/docs`
- OpenAPI JSON: `http://localhost:3000/api/openapi.json`

### front-web / admin-web

各ディレクトリで依存関係をインストールしてから開発サーバーを起動します。

```powershell
cd front-web
npm.cmd run dev
```

```powershell
cd admin-web
npm.cmd run dev
```

### back-api Integration Test

```powershell
cd back-api
npm.cmd run test:integration
```

Integration Testは `DB_TEST_FILE`（既定値 `./data/test.db`）を使い、実行前に初期化し、終了後にSQLiteファイルとsidecarを削除します。

## VS Code

`.vscode/launch.json` の `front-web run`、`back-api run`、`admin-web run`、`all dev` から起動できます。`db:setup` はback-apiのmigrationとseedを適用します。

## 推奨拡張

- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- GitLens (`eamodio.gitlens`)
- EditorConfig (`editorconfig.editorconfig`)
