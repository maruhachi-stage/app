# アーキテクチャ

## 目的

この文書は、`front-web` を変更に強く、責務が明確で、外部実装を置き換え可能な構造で維持するための原則を定義する。

フレームワーク固有の書き方や細かな命名規則は定義しない。設計上の責務と依存境界を定義する。

## レイヤーと依存方向

アプリケーションは次の4レイヤーで構成する。

```text
Presentation → Application / Domain
Application  → Domain / Infrastructure
Infrastructure → Domain
Domain → 外側のレイヤーへ依存しない
```

- Presentation は画面、HTTP境界、外部入力を扱う。
- Application はユースケースと状態・処理フローを調整する。
- Domain は正規化済みの型、業務ルール、不変条件を定義する。
- Infrastructure はAPI、DB、ストレージ、外部ProviderなどのI/Oを実装する。

依存は常に内側へ向ける。DomainはPresentation、Infrastructure、フレームワークに依存してはならない。

## ディレクトリの責務

| パス | 責務 |
| --- | --- |
| `app/routes/` | HTTP境界と画面の組み立て |
| `app/components/` | 表示コンポーネント |
| `app/hooks/` | クライアント側のApplicationロジック |
| `app/usecases/` | サーバー側のApplicationロジック |
| `app/domain/` | Domain型と純粋な業務ロジック |
| `app/service/` | 外部I/Oの抽象化と正規化 |
| `app/lib/` | 技術的な共通ユーティリティ |
| `app/context/` | 横断的なUIまたはセッション状態 |
| `server/` | DBクライアント、Repositoryなどサーバー専用処理 |

ディレクトリ名は手段であり、責務の境界を明確にすることを優先する。

## ファイル責務

各ファイルは、ひとつのまとまった責務だけを持つ。

- ファイルは明確なひとつの目的を表す。
- 同じ責務を支えるヘルパー関数は同居してよい。
- 無関係なユースケースや操作をひとつのファイルにまとめない。
- 構造の明確さを保てるなら、ファイル数の増加は許容する。
- 役割の説明に「〜と〜」が必要なら、分割を検討する。

## Presentation

Presentationは外部入出力の境界である。

行ってよいこと:

- 外部入力、URL、form dataのparseと形式検証
- 認証・認可の確認
- Applicationのユースケースまたはserviceの呼び出し
- Domain型を表示用データへ変換すること
- 画面固有の表示構成

行ってはならないこと:

- 業務ルールの定義や評価
- DBや外部Providerへの直接アクセス
- 生のInfrastructure型をUIへ渡すこと

画面やHTTP境界のmoduleは薄く保つ。

## Application

Applicationはユースケースと処理フローを調整する。

行ってよいこと:

- 複数service呼び出しの調整
- 認可の適用
- Domainルールの適用
- Infrastructure ErrorをAppErrorへ変換すること
- UI操作やサーバー処理の状態遷移を組み立てること

行ってはならないこと:

- UIの詳細に依存すること
- 生の外部レスポンス形式を返すこと
- Infrastructureの実装詳細を公開すること

複数の外部操作を調整する場合、認可を含む場合、またはDomainルールを評価する場合は、専用のユースケースを作る。

## Domain

Domainは業務上の正とする。

Domainに含めるもの:

- Entity
- Value Object
- Domain型
- 業務上の不変条件
- 純粋な検証ルール
- Domain Error

Domainはフレームワーク、UI、HTTP、DB、外部Providerの形式に依存してはならない。外部のDTOや命名規則をDomainへ漏らしてはならない。

## InfrastructureとService

Infrastructureおよびserviceは、外部システムとの境界を担当する。

行うこと:

- API、DB、ストレージ、外部Providerとの通信
- データの取得と更新
- RawデータまたはDTOからDomain型への正規化
- retryやrate limitなど外部通信に関する技術的処理
- 失敗時のAppError送出

行ってはならないこと:

- UIロジック
- Domainルールの定義
- 生の外部レスポンス形式の公開
- 複数Domain概念の業務フロー調整

Raw型はserviceまたはInfrastructure境界から外へ出してはならない。

## サーバー専用コード

`server/` 配下のコードはクライアント側からimportしてはならない。

- Secret
- サーバー専用の環境変数
- DBクライアント
- Repository
- Node.js専用API

画面コンポーネントとクライアント側hookは、`server/` に依存してはならない。

## UI配置

UIは再利用範囲に応じて配置する。

- ページ固有のUI → `components/<area>/parts/`
- 画面を構成するページコンポーネント → `components/<area>/pages/`
- Feature内で再利用するUI → `components/<area>/`
- Feature横断で再利用するUI → `components/shared/`

UI設定は、それを所有するFeatureまたは画面の近くに置く。グローバルな定数置き場へ雑多に集めない。

## 状態の所有者

状態には明確な所有者を持たせる。

- URL状態 → 画面またはHTTP境界
- UI状態 → componentまたはhook
- サーバー状態 → サーバー側の読み込み処理
- Application flow状態 → hookまたはuse case
- 業務状態 → Domain

無関係な関心ごとのためにglobal stateを使わない。

## データ変換とエラー処理

レイヤー間の変換はすべて明示する。

```text
外部入力 → Presentation → Application → Domain
外部結果 → Infrastructure / Service → Domain → Presentation
```

構造が似ていることを理由に変換を省略しない。

Infrastructure ErrorはAppErrorへ変換する。AppErrorは機械可読なcodeを持ち、外部Providerの詳細、stack trace、生のエラーメッセージをUIへ公開しない。

## `lib/` のルール

`lib/` は技術的な共通ユーティリティ専用とする。

許可するもの:

- assertion helper
- class name utility
- 汎用format処理
- 汎用functional utility
- クライアント安全な環境変数アクセス

許可しないもの:

- 業務ルール
- Feature固有の処理フロー
- 外部I/O
- UI設定
- Domainロジック

## テスト

- Domainはnetwork、browser、DBに依存しないunit testで検証する。
- Serviceは外部システムのmockまたはfakeを使って検証する。
- Use caseはservice mockを使って検証する。
- Hookはservice mockを使って状態と操作フローを検証する。
- Presentationは入力処理、認可、出力形式を検証する。
- Componentはユーザー操作を基準に検証する。
- 実装詳細ではなく、観測可能な振る舞いをテストする。
