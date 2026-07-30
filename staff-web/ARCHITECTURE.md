# ARCHITECTURE.md

## 対象アプリケーション

この文書はスタッフ向けWebアプリケーションである`staff-web`を対象とする。利用者向け画面の方針は`front-web/ARCHITECTURE.md`を参照する。

## 概要

React Router v7で構成するSPAである。4層で責務を分け、機能ごとのコードは`app/features/`にまとめる。

## 4層と依存方向

```text
Presentation → Application → Domain
                     ↓
              Infrastructure → Domain
```

- Domainは他の層に依存しない。
- PresentationはApplicationとDomainを利用できる。
- ApplicationはDomainとInfrastructureを利用できる。
- InfrastructureはDomainを利用できる。

## 配置

### Feature内

一つのFeatureだけで使うコードは`app/features/<feature>/`に置く。

```text
app/features/<feature>/
├── pages/          # Presentation
├── components/     # Presentation
├── hooks/          # Application
├── usecases/       # Application
├── domain/         # Domain
└── api/            # Infrastructure
```

既存のdirectoryに当てはまらない場合は、所属する層を明確にしてFeature内に追加できる。

### Feature外

Feature外にはRouteの境界、複数Featureで使うコード、技術的な共通処理だけを置く。

| Path              | 配置するもの                                        |
| ----------------- | --------------------------------------------------- |
| `app/routes.ts`   | URLとRoute moduleの登録                             |
| `app/routes/`     | `clientLoader`、`clientAction`、meta、ErrorBoundary |
| `app/components/` | 複数Featureで使うcomponent                          |
| `app/hooks/`      | 複数Featureで使うhook                               |
| `app/config/`     | Routeや公開環境設定                                 |
| `app/lib/`        | 技術的な共通処理                                    |
| `app/types/`      | 複数Featureで使う型                                 |
| `public/`         | 静的asset                                           |

## 共通ルール

- 必要なdirectoryだけ作る。
- Importは`~/`aliasを使う。
- 1fileに1つの責務を持たせる。
- Feature間で内部fileを直接参照しない。
- 循環依存を作らない。
- Secret、DB client、Node.js専用APIを含めない。
- 公開できない値を`VITE_`環境変数へ設定しない。

## 各層のルール

### Presentation

- Route moduleは`clientLoader`、`clientAction`、meta、ErrorBoundary、Pageの呼び出しに限定する。
- Path、search params、`clientLoader`のデータはRouteが持つ。
- Pageとcomponentには画面の表示と入力処理を書く。
- Component内だけの状態はComponentが持つ。
- 業務ルールと外部I/Oは書かない。

### Application

- 一つの操作や状態は`hooks/`に置く。
- 複数処理の調整は`usecases/`に置く。
- 複数Componentにまたがる状態はHookが持つ。
- JSXと外部response型は書かない。

### Domain

- 型、純粋な検証、業務ルールを書く。
- React、React Router、外部APIに依存しない。
- 外部データの`snake_case`は書かない。

### Infrastructure

- API呼び出しとresponse型は`api/`に置く。
- ResponseはDomainの型へ変換して返す。
- 共通のHTTP処理は`app/lib/api-client.ts`を使う。
- UI状態、業務ルール、複数処理の調整は書かない。
