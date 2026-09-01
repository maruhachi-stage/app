# SETUP

## 必須環境

前提：開発環境は Windows を想定しています。

- [Node.js](https://nodejs.org/) 20 以上（npm 10 以上が同梱されています）
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)（MySQL 用）
- [Git for Windows](https://git-for-windows.github.io/)

## プロジェクト構成

- `front-web` : React Router v7 フロントエンド
- `admin-web` : React Router v7 管理画面
- `back-api` : Hono API + MySQL（Docker）

## 初回セットアップ

PowerShell で `npm` 実行時に実行ポリシーエラーが出る環境では、`npm` の代わりに `npm.cmd` を使ってください。

```powershell
cd front-web
npm.cmd install

cd ../admin-web
npm.cmd install

cd ../back-api
npm.cmd install
```

各フォルダの `.env.example` をコピーして `.env` を作成します。

```powershell
copy front-web\.env.example front-web\.env
copy admin-web\.env.example admin-web\.env
copy back-api\.env.example back-api\.env
```

## 起動方法（手動）

### 1) MySQL（Docker）

```powershell
cd back-api
npm.cmd run db:setup
```

`db:setup`はMySQLコンテナを起動し、未適用のDrizzle migrationを適用します。既存データを削除する必要はありません。

- MySQL 接続先: `localhost:3306`
- DB 名（既定値）: `hal_cinema`
- ユーザー（既定値）: `hal_user`
- パスワード（既定値）: `hal_pass`

### 2) back-api

```powershell
cd back-api
npm.cmd run dev
```

- 起動 URL: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/api/docs`
- OpenAPI JSON: `http://localhost:3000/api/openapi.json`

### 3) front-web

```powershell
cd front-web
npm.cmd run dev
```

### 4) admin-web

```powershell
cd admin-web
npm.cmd run dev
```

## 停止・リセット（MySQL）

```powershell
cd back-api
npm.cmd run db:down   # 停止
npm.cmd run db:reset  # 停止 + データ削除
```

## 起動方法（VS Code）

`.vscode/launch.json` に起動設定を追加済みです。Run and Debug から選択して起動できます。

| 設定名          | 内容                        |
| --------------- | --------------------------- |
| `front-web run` | front-web 開発サーバー      |
| `back-api run`  | back-api 開発サーバー       |
| `admin-web run` | admin-web 開発サーバー      |
| `db:up`         | MySQL 起動                  |
| `db:setup`      | MySQL 起動 + migration 適用 |
| `db:down`       | MySQL 停止                  |
| `db:reset`      | MySQL 停止 + データ削除     |
| `all dev`       | 上記すべてを一括起動        |

## 推奨拡張 / プラグイン

### VS Code

- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- Docker (`ms-azuretools.vscode-docker`)
- GitLens (`eamodio.gitlens`)
- EditorConfig (`editorconfig.editorconfig`)
- SQLTools (`mtxr.sqltools`)
- SQLTools MySQL/MariaDB (`mtxr.sqltools-driver-mysql`)
