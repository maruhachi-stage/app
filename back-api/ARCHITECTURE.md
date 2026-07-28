# アーキテクチャ

## 目的

`back-api` は、変更に強く、責務が明確で、外部実装を置き換え可能なバックエンドを目指す。

この文書はアーキテクチャ上の原則と責務の境界を定義する。フレームワーク固有の書き方や細かな命名規則は、必要に応じて別文書で扱う。

## レイヤーと依存方向

アプリケーションは次の4レイヤーで構成する。

```text
Presentation → Application / Domain
Application  → Domain
Infrastructure → Application / Domain
Domain → 外側のレイヤーへ依存しない
```

- Presentation はHTTP入出力を扱う。
- Application はユースケースを調整する。
- Domain は業務ルールと中核モデルを定義する。
- Infrastructure はDBや外部サービスなどのI/Oを実装する。

依存は常に内側へ向ける。DomainはPresentation、Infrastructure、フレームワークに依存してはならない。

## ディレクトリの責務

| パス | 責務 |
| --- | --- |
| `src/presentation/` | HTTP handler、middleware、外部入出力の変換 |
| `src/application/` | ユースケース、Application Service、DTO、Port |
| `src/domain/` | Entity、Value Object、業務ルール、Repository契約、Domain Error |
| `src/infrastructure/` | DB、Repository実装、外部API、Provider Adapter |
| `src/di/` | 実装の組み立てと依存性注入 |
| `src/lib/` | 技術的な共通ユーティリティ |
| `migrations/` | DBスキーマ変更履歴 |

ディレクトリ名は手段であり、責務の境界を明確にすることを優先する。

## ファイル責務

各ファイルは、ひとつのまとまった責務だけを持つ。

- ファイルは明確なひとつの目的を表す。
- 同じ責務を支えるヘルパー関数は同居してよい。
- 無関係なユースケースをひとつのファイルにまとめない。
- 構造の明確さを保てるなら、ファイル数の増加は許容する。
- 役割の説明に「〜と〜」が必要なら、分割を検討する。

## Presentation

PresentationはHTTP境界のAdapterである。

行ってよいこと:

- request、path parameter、queryのparseと形式検証
- 認証・認可の確認
- Application Serviceまたはユースケースの呼び出し
- Application結果からHTTP responseへの変換
- Application ErrorからHTTP errorへの変換

行ってはならないこと:

- 業務ルールの定義や評価
- DBや外部Providerへの直接アクセス
- Infrastructureの生データをそのまま返すこと

## Application

Applicationはユースケースを調整する。

行ってよいこと:

- 複数のRepositoryやPortの呼び出しを組み立てる
- Domainルールを適用する
- 認可ポリシーを適用する
- 入出力DTOをDomainモデルへ明示的に変換する
- 予期可能な外部エラーをApplication Errorへ変換する

行ってはならないこと:

- HTTP、フレームワーク、UIの詳細に依存すること
- Infrastructureの生データや実装詳細を外へ公開すること

複数の外部操作を調整する場合、認可やDomainルールの評価を含む場合は、専用のユースケースまたはApplication Serviceを作る。

## Domain

Domainは業務上の正とする。

Domainに含めるもの:

- Entity
- Value Object
- Domain型
- 業務上の不変条件
- 純粋な検証ルール
- Domain Error
- Repositoryおよび外部Portの契約

Domainはフレームワーク、HTTP形式、DB形式、外部Providerの形式に依存してはならない。外部システムの命名規則やDTOをDomainへ漏らしてはならない。

## Infrastructure

Infrastructureは外部契約の実装を担当する。

含めるもの:

- Drizzleを用いたDBアクセス
- Repository実装
- 外部APIやメール送信などのAdapter
- 外部データの取得と正規化
- DB migrationとseed処理

Infrastructureは次を守る。

- ApplicationまたはDomainで定義した契約を実装する。
- 外部データを内側へ返す前に正規化する。
- DBやProvider固有の形式をInfrastructure境界の外へ出さない。
- 業務ルールを定義しない。

## データ変換

レイヤー間の変換はすべて明示する。

```text
HTTP Request
  → Presentation Input
  → Application DTO
  → Domain Model
  → Infrastructure Implementation
```

```text
Infrastructure Result
  → Domain Model
  → Application Result
  → HTTP Response
```

構造が似ていることを理由に変換を省略しない。外部のRawデータ、DB Row、HTTP DTOは、そのままDomainモデルとして扱わない。

## エラー処理

すべてのエラーはアプリケーション上の意味を持つ形に変換する。

- Infrastructure Errorを外部へ直接公開しない。
- Provider固有の詳細、SQL、stack trace、生のエラーメッセージをresponseに含めない。
- ApplicationまたはDomainのErrorには機械可読なcodeを持たせる。
- PresentationはErrorを一貫したHTTP responseへ変換する。

## `lib/` のルール

`lib/` は技術的な共通ユーティリティ専用とする。

許可するもの:

- 汎用format処理
- assertion helper
- 汎用functional utility
- 技術的な環境変数アクセス

許可しないもの:

- 業務ルール
- Feature固有の処理フロー
- 外部I/O
- UIやHTTPの設定
- Domainロジック

`lib/` を雑多な置き場にしない。

## テスト

- DomainはnetworkやDBに依存しない純粋なunit testで検証する。
- ApplicationはRepositoryやPortのmockを使ってユースケースを検証する。
- Infrastructureはfake、mock、または統合環境を使って外部契約を検証する。
- Presentationはrequestの解釈、認可、response変換を検証する。
- 実装詳細ではなく、観測可能な振る舞いをテストする。
