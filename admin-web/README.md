# HAL Cinema Admin Web

映画館管理画面です。React Router v7、TypeScript、TailwindCSS v4 で構成しています。

## 主な画面

- ダッシュボード
- 映画情報管理
- 座席マスター
- 上映スケジュール
- 管理設定

## Development

```bash
npm install
npm run dev
```

標準の開発 URL は `http://localhost:5174` です。

## Validation

```bash
npm run typecheck
npm run build
```

## Admin Edit Key

ログイン画面を作るまでは、バックエンドの `ADMIN_EDIT_KEY` と画面で手入力した編集キーを照合して編集可否を判断します。
