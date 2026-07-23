# AGENTS.md

## 基本ルール

- 依頼に必要な最小限の変更だけを行う。
- ユーザーの変更を上書き・取り消ししない。
- シークレット、資格情報、個人情報、実環境の値をコードに含めない。
- 不明点によって結果が変わる場合は確認する。

## ブランチ

- `develop` から作業ブランチを作り、`develop` へ PR を出す。
- `main` と `develop` へ直接 push しない。
- ブランチ名は `<type>/[<issue番号>-]<英語のkebab-case>` とし、Issue がなければ番号を省略する。
- `type` は `feature`、`fix`、`refactor`、`docs`、`chore`、`release` を使う。

## コミット

- 勝手にコミットしない。
- コミットメッセージは日本語で簡潔に書く。

## ドキュメント

| 文書                         | 確認内容                   |
|----------------------------|------------------------|
| `README.md`                | リポジトリの目的               |
| `AGENTS.md`                | 作業ルール                  |
| bacj-api/`ARCHITECTURE.md` | バックエンドの配置、責務、依存方向、実装方法 |

## 検証

作業終了時に以下のコマンドが通ることを確認する。

- `npm run format:check`
- `npm run lint`
- `npm run type-check`
- `npm test`
