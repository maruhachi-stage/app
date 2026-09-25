# コントリビューションガイド

maruhachi-stage への変更は、Issue の内容を確認し、ブランチで作業して Pull Request（PR）でレビューを受けてから `develop` に取り込みます。

## 文書の役割

- `README.md`: リポジトリの概要
- `SETUP.md`: 開発環境のセットアップと起動方法
- `CONTRIBUTING.md`: Issue からレビュー・マージまでの開発フロー
- `AGENTS.md`: 実装時のルールと作業終了時の検証項目
- 各アプリの `ARCHITECTURE.md`: アプリごとの構成と責務

## 開発フロー

### 1. Issue を確認する

着手前に対象 Issue の目的、対応範囲、完了条件を確認します。仕様や範囲に不明点がある場合は、Issue で確認してから作業を始めます。

### 2. ブランチを作成する

最新の `develop` から作業ブランチを作成します。

```powershell
git switch develop
git pull origin develop
git switch -c <type>/<issue番号>-<英語のkebab-case>
```

ブランチ名の `<type>` には、作業内容に応じて `feature`、`fix`、`refactor`、`docs`、`chore`、`release` のいずれかを使います。たとえば Issue #19 のドキュメント変更なら、`docs/19-contributing-guide` とします。

`main` と `develop` へ直接 push せず、必ず作業ブランチから PR を作成します。

### 3. 実装・コミットする

- Issue の完了条件を満たすために必要な最小限の変更を行います。
- 既存の変更を上書き・取り消しません。
- シークレット、資格情報、個人情報、本番データをリポジトリに含めません。
- コミットは変更のまとまりごとに行い、メッセージは日本語で簡潔に書きます。

```powershell
git add <変更したファイル>
git commit -m "変更内容を簡潔に記載"
git push -u origin <ブランチ名>
```

### 4. PR を作成する

PR の base は `develop` にします。タイトルは PR テンプレートに合わせ、`[作業種別] 概要` の形式にします。

PR には次の内容を記載します。

- 背景と、この PR で良くなること
- 変更内容
- 関連 Issue（例: `#19`、自動クローズする場合は `Closes #19`）
- 再現方法または確認手順
- 実行した検証コマンドと結果
- UI に変更がある場合は画面キャプチャ

### 5. レビューを受ける

PR 作成前に差分、関連ファイル、Issue の完了条件、検証結果を自分で確認します。レビューコメントには対応内容を返信し、必要に応じて修正と再検証を行います。

### 6. CI 通過後にマージする

レビューで承認され、CI の必須チェックがすべて通過したことを確認してから `develop` にマージします。CI が失敗した場合は原因を修正し、再度チェックを通します。

## 変更前の確認

`SETUP.md` に従って依存関係と環境を準備し、変更したアプリのディレクトリで該当するコマンドを実行します。複数のアプリを変更した場合は、それぞれで確認します。

```powershell
cd <アプリのディレクトリ>
npm.cmd install
npm.cmd run build
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run format:check
npm.cmd test
```

`image-server` のように `build` または `typecheck` スクリプトがないアプリでは、定義されている `lint`、`format:check`、`test` などのコマンドを実行します。コマンドの定義は各アプリの `package.json` を確認してください。

最終的な検証項目は `AGENTS.md` に従います。テストの種類や配置については `docs/testing-strategy.md` を参照してください。
