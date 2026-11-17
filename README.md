# README

maruhachi-stage のリポジトリです。  

名古屋の専門学生が作る架空の映画館サイト

映画・舞台・演劇を見ることができます

## 構成

- `front-web` / `staff-app` : Cloudflare Pages（SPA + `/api/*` プロキシ）
- `back-api` : Cloudflare Workers（Hono + D1 + R2）
- `image-server` : ローカル開発用の画像配信（本番は R2 + Worker）

セットアップとデプロイ手順は `SETUP.md` を参照してください。
