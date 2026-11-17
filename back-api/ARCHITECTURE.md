# ARCHITECTURE.md

## 概要

`back-api`はPresentation、Application、Domain、Infrastructureの4層で責務を分ける。

## 4層と依存方向

```text
Presentation → Application / Domain
Presentation Middleware → DI
Application → Domain
Infrastructure → Application / Domain
DI → Application / Infrastructure
```

- Domainは他の層に依存しない。
- PresentationはApplicationとDomainを利用できる。
- PresentationのDI Middlewareだけは、DIコンテナをContextへ注入するためDIを利用できる。
- ApplicationはDomainを利用できる。
- InfrastructureはApplicationとDomainの契約を実装する。
- DIで契約と実装を組み合わせる。

## 配置

| Path                                  | 配置するもの                              |
| ------------------------------------- | ----------------------------------------- |
| `src/app.ts`                          | HonoアプリとRoute定義                     |
| `src/worker.ts`                       | Workers entry point（fetch/scheduled）    |
| `src/presentation/routes/`            | API prefixを持たないルート（`/images/*`） |
| `src/presentation/controllers/`       | HTTP入力とレスポンス変換                  |
| `src/presentation/middleware/`        | Hono middleware                           |
| `src/application/services/`           | Application Service                       |
| `src/application/ports/`              | 外部サービスの契約                        |
| `src/application/dto/`                | HTTPのrequest、query、responseの契約      |
| `src/domain/entities/`                | Domain Entity                             |
| `src/domain/interfaces/repositories/` | Repositoryの契約                          |
| `src/domain/errors/`                  | Domain Error                              |
| `src/infrastructure/repositories/`    | Repositoryの実装                          |
| `src/infrastructure/adapters/`        | Portの実装                                |
| `src/infrastructure/database/`        | D1接続、Drizzle schema、seed              |
| `src/di/container.ts`                 | 依存関係の組み立て                        |
| `src/lib/`                            | DBや環境変数の共通処理                    |
| `migrations/`                         | Drizzle Kitの出力（正）                   |
| `d1/migrations/`                      | wranglerが適用するmigration（生成物）     |
| `d1/seed.sql`                         | D1へ投入するマスタデータ（生成物）        |
| `scripts/`                            | migration/seedの変換、R2への画像投入      |
| `test/`                               | Testとfixture                             |

## 型の境界

- HTTPのrequest body、query、responseの契約は`src/application/dto/`に置く。
- 検証後のHTTP入力はRequest DTOとしてApplication Serviceへ渡す。
- Application ServiceはDTOとDomain型を変換する。
- Domain modelとRepositoryの入力、検索条件、戻り値は`src/domain/`に置く。
- RepositoryはDTOを受け取らない。
- IDなどの単純な値や内部処理だけで使う型はDTOにしない。
- DTOは`CreateEventRequestDTO`、`UpdateEventRequestDTO`、`EventDTO`、`EventListResponseDTO`のように役割を名前で示す。

## 共通ルール

- 必要なdirectoryだけ作る。
- 1fileに1つの責務を持たせる。
- 循環依存を作らない。

## 各層のルール

### Presentation

- ControllerはHTTP入力の取得と検証、HTTPレスポンスへの変換を行う。
- MiddlewareはHTTPに共通する処理だけを持つ。
- 業務ルール、DB操作、外部サービスの処理は書かない。

### Application

- Application Serviceはユースケースを実行する。
- 外部サービスはPortの契約を介して利用する。
- Hono、D1、外部SDKに依存しない。

### Domain

- Entity、Repositoryの契約と入出力型、Domain Errorを置く。
- 業務ルールはFrameworkに依存させない。
- HTTP、DB schema、外部サービスの形式を持ち込まない。

### Infrastructure

- RepositoryはDrizzle（`drizzle-orm/d1`）経由でD1を操作し、DB rowからEntityへの変換を行う。
- AdapterはPortを外部サービスへ接続する（`R2ImageStorage`、`DrizzleSessionManager`など）。
- Drizzle schemaは`src/infrastructure/database/schema.ts`に置く。
- Schema変更時は`migrations/`に新しいmigrationを生成し、`npm run db:migrations:export`で`d1/migrations/`へ書き出す。
- 適用済みmigrationは変更しない。
- HTTPの入力処理と業務ルールは書かない。

### Cloudflare固有の制約

- `db`は`createContainer(env)`でリクエストごとの`env.DB`から生成し、各Repositoryはconstructorで受け取る（モジュールスコープのDB接続を持たない）。
- D1には対話型transactionがないため、Reservationの確定とPOS会計は`db.batch()`（原子的）と一意制約で直列化する。座席は`reservation_seats(schedule_id, seat_id)`の一意制約で二重予約を拒否する。
- セッションはD1の`sessions`テーブルへ保存する。isolateのメモリはリクエストをまたいで保証されない。
- 画像は非公開のR2バケットへ置き、Workerの`GET /images/*`だけが配信する。R2の公開URLは使わない。
- スケジュールの自動生成は`src/worker.ts`の`scheduled`ハンドラ（Cron Triggers、15:00 UTC = 0:00 JST）から実行する。
- レート制限はisolate単位のメモリで動作するため、分散環境では実効的な制限が緩くなる（将来D1またはDurable Objectへ移行）。
- モジュールスコープで`setInterval`等のタイマーを張らない。
