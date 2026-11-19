# README

maruhachi-stage のリポジトリです。  

名古屋の専門学生が作る架空の映画館サイト

映画・舞台・演劇を見ることができます

## 構成

- `apps/user` / `apps/staff` : Cloudflare Pages（SPA + `/api/*`・`/images/*` 転送）
- `apps/api` : Cloudflare Workers（Hono + D1 + R2 + Cron）

画像は R2 に置き、API Worker の `GET /images/*` が配信します。ローカル開発も `wrangler dev`（Miniflare の D1 / R2）で同じ構成のまま動くため、環境ごとの実装の分岐はありません。

セットアップとデプロイ手順は `SETUP.md` を参照してください。
