# apps/user

npm の依存関係はリポジトリルートで `npm.cmd install` を1回実行すると、npm workspaces により3アプリ分がまとめてインストールされます。

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 SPA モード（Cloudflare Pages で静的配信）
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:3030`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

このアプリは Cloudflare Pages へ静的配信します。`npm run build` は `build/client` に SPA を生成します。

```bash
npm run build
npx wrangler pages deploy build/client --project-name maruhachi-stage --branch main
```

- `wrangler.toml` の `pages_build_output_dir` は `build/client`
- `public/_redirects` の `/* /index.html 200` で SPA フォールバック
- `public/_routes.json` で Pages Functions を `/api/*` だけに絞る
- `functions/api/[[path]].ts` は `API` サービスバインディングで Worker を直接呼び、ブラウザから見ると同一オリジンのままにする

API Worker は `workers.dev` を公開せず、Pages の Access を通過したリクエストだけを受けます。

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.
