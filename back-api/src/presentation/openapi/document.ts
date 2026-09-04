type JsonObject = Record<string, unknown>

type ApiRoute = {
  method: 'get' | 'post'
  path: string
  operationId: string
  summary: string
  tags: string[]
  parameters?: JsonObject[]
  requestBody?: JsonObject
  response?: JsonObject
  status?: number
  enveloped?: boolean
}

const anyData = { type: 'object', additionalProperties: true }
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` })

const requestBody = (schema: string, description: string) => ({
  required: true,
  description,
  content: { 'application/json': { schema: ref(schema) } },
})

const parameter = (
  name: string,
  location: 'path' | 'query' | 'header',
  description: string,
  required = false,
) => ({
  name,
  in: location,
  required: required || location === 'path',
  description,
  schema: { type: 'string' },
})

const routes: ApiRoute[] = [
  {
    method: 'get',
    path: '/api/v1/health',
    operationId: 'getHealth',
    summary: 'APIの稼働状態を確認する',
    tags: ['Health'],
    response: { type: 'object', properties: { status: { type: 'string', example: 'ok' } } },
    enveloped: false,
  },
  {
    method: 'post',
    path: '/api/members',
    operationId: 'createMember',
    summary: '会員を作成または取得する',
    tags: ['Members'],
    requestBody: requestBody('CreateMemberRequest', '会員情報'),
    status: 201,
    response: ref('Member'),
  },
  {
    method: 'get',
    path: '/api/members/profile',
    operationId: 'getMemberProfile',
    summary: 'ログイン中の会員情報を取得する',
    tags: ['Members'],
    response: ref('Member'),
  },
  {
    method: 'get',
    path: '/api/members/reservations',
    operationId: 'getMemberReservations',
    summary: 'ログイン中の会員の予約一覧を取得する',
    tags: ['Members'],
    response: ref('ReservationList'),
  },
  {
    method: 'get',
    path: '/api/auth/me',
    operationId: 'getCurrentUser',
    summary: '現在の認証状態を取得する',
    tags: ['Auth'],
    response: anyData,
  },
  {
    method: 'post',
    path: '/api/auth/otp/send',
    operationId: 'sendOtp',
    summary: '認証用OTPを送信する',
    tags: ['Auth'],
    requestBody: requestBody('OtpSendRequest', 'OTP送信先'),
    status: 200,
  },
  {
    method: 'post',
    path: '/api/auth/otp/verify',
    operationId: 'verifyOtp',
    summary: 'OTPを検証する',
    tags: ['Auth'],
    requestBody: requestBody('OtpVerifyRequest', 'OTP検証情報'),
    status: 200,
  },
  {
    method: 'post',
    path: '/api/auth/logout',
    operationId: 'logout',
    summary: 'ログアウトする',
    tags: ['Auth'],
    status: 200,
  },
  {
    method: 'get',
    path: '/api/movies',
    operationId: 'listMovies',
    summary: '上映中の映画一覧を取得する',
    tags: ['Movies'],
    parameters: [
      parameter('date', 'query', '上映日（YYYY-MM-DD）'),
      parameter('status', 'query', '上映ステータス'),
    ],
    response: ref('MovieList'),
  },
  {
    method: 'get',
    path: '/api/movies/{movieId}',
    operationId: 'getMovie',
    summary: '映画を取得する',
    tags: ['Movies'],
    parameters: [parameter('movieId', 'path', '映画ID', true)],
    response: ref('Movie'),
  },
  {
    method: 'get',
    path: '/api/movies/{movieId}/schedules',
    operationId: 'getMovieSchedules',
    summary: '映画の上映スケジュールを取得する',
    tags: ['Movies'],
    parameters: [
      parameter('movieId', 'path', '映画ID', true),
      parameter('date', 'query', '上映日（YYYY-MM-DD）'),
    ],
    response: ref('MovieSchedules'),
  },
  {
    method: 'get',
    path: '/api/schedules/{scheduleId}',
    operationId: 'getSchedule',
    summary: '上映スケジュールを取得する',
    tags: ['Movies'],
    parameters: [parameter('scheduleId', 'path', 'スケジュールID', true)],
    response: ref('Schedule'),
  },
  {
    method: 'get',
    path: '/api/stages',
    operationId: 'listStages',
    summary: '舞台・イベント一覧を取得する',
    tags: ['Stages'],
    parameters: [
      parameter('date', 'query', '上映日（YYYY-MM-DD）'),
      parameter('status', 'query', '上映ステータス'),
      parameter('type', 'query', 'stageまたはevent'),
    ],
    response: ref('StageList'),
  },
  {
    method: 'get',
    path: '/api/stages/{stageId}',
    operationId: 'getStage',
    summary: '舞台・イベントを取得する',
    tags: ['Stages'],
    parameters: [parameter('stageId', 'path', '舞台・イベントID', true)],
    response: ref('Stage'),
  },
  {
    method: 'get',
    path: '/api/stages/{stageId}/schedules',
    operationId: 'getStageSchedules',
    summary: '舞台・イベントの上映スケジュールを取得する',
    tags: ['Stages'],
    parameters: [
      parameter('stageId', 'path', '舞台・イベントID', true),
      parameter('date', 'query', '上映日（YYYY-MM-DD）'),
    ],
    response: ref('StageSchedules'),
  },
  {
    method: 'post',
    path: '/api/reservations/quote',
    operationId: 'quoteReservation',
    summary: '予約料金を見積もる',
    tags: ['Reservations'],
    requestBody: requestBody('QuoteRequest', 'チケット枚数'),
    response: ref('Quote'),
  },
  {
    method: 'get',
    path: '/api/reservations/schedules/{scheduleId}/seats',
    operationId: 'getSeatMap',
    summary: '上映の座席状況を取得する',
    tags: ['Reservations'],
    parameters: [parameter('scheduleId', 'path', 'スケジュールID', true)],
    response: ref('SeatMap'),
  },
  {
    method: 'post',
    path: '/api/reservations/hold',
    operationId: 'holdSeats',
    summary: '座席を一時確保する',
    tags: ['Reservations'],
    requestBody: requestBody('HoldRequest', '確保する座席'),
    status: 201,
    response: ref('ReservationHold'),
  },
  {
    method: 'post',
    path: '/api/reservations',
    operationId: 'createReservation',
    summary: '予約を確定する',
    tags: ['Reservations'],
    requestBody: requestBody('CreateReservationRequest', '予約内容'),
    status: 201,
    response: ref('Reservation'),
  },
  {
    method: 'get',
    path: '/api/reservations/{reservationCode}',
    operationId: 'getReservation',
    summary: '予約詳細を取得する',
    tags: ['Reservations'],
    parameters: [parameter('reservationCode', 'path', '予約コード', true)],
    response: ref('Reservation'),
  },
  {
    method: 'post',
    path: '/api/reservations/{reservationCode}/cancel',
    operationId: 'cancelReservation',
    summary: '予約をキャンセルする',
    tags: ['Reservations'],
    parameters: [parameter('reservationCode', 'path', '予約コード', true)],
    requestBody: requestBody('CancelReservationRequest', 'ゲスト予約の認証情報'),
    response: anyData,
  },
  {
    method: 'get',
    path: '/api/screens',
    operationId: 'listScreens',
    summary: 'スクリーン一覧を取得する',
    tags: ['Screens'],
    response: anyData,
  },
  {
    method: 'get',
    path: '/api/screens/{screenId}',
    operationId: 'getScreen',
    summary: 'スクリーンを取得する',
    tags: ['Screens'],
    parameters: [parameter('screenId', 'path', 'スクリーンID', true)],
    response: anyData,
  },
  {
    method: 'get',
    path: '/api/config',
    operationId: 'getConfig',
    summary: 'チケット設定を取得する',
    tags: ['Config'],
    response: ref('Config'),
  },
  {
    method: 'get',
    path: '/api/products',
    operationId: 'listProducts',
    summary: '商品一覧を取得する',
    tags: ['Products'],
    response: anyData,
  },
  {
    method: 'get',
    path: '/api/products/{productId}',
    operationId: 'getProduct',
    summary: '商品を取得する',
    tags: ['Products'],
    parameters: [parameter('productId', 'path', '商品ID', true)],
    response: anyData,
  },
  {
    method: 'get',
    path: '/api/pos/products',
    operationId: 'listPosProducts',
    summary: 'POS商品一覧を取得する',
    tags: ['POS'],
    response: anyData,
  },
  {
    method: 'get',
    path: '/api/pos/sales',
    operationId: 'listPosSales',
    summary: 'POS売上一覧を取得する',
    tags: ['POS'],
    parameters: [parameter('limit', 'query', '取得件数（1〜50）')],
    response: anyData,
  },
  {
    method: 'post',
    path: '/api/pos/sales',
    operationId: 'createPosSale',
    summary: 'POS売上を登録する',
    tags: ['POS'],
    requestBody: requestBody('PosSaleRequest', '売上内容'),
    status: 201,
    response: anyData,
  },
  {
    method: 'get',
    path: '/api/admin/overview',
    operationId: 'getAdminOverview',
    summary: '管理ダッシュボード概要を取得する',
    tags: ['Admin'],
    response: anyData,
  },
  {
    method: 'post',
    path: '/api/admin/edit-key/verify',
    operationId: 'verifyAdminEditKey',
    summary: '管理編集キーを検証する',
    tags: ['Admin'],
    parameters: [parameter('X-Admin-Edit-Key', 'header', '管理編集キー', true)],
    response: anyData,
  },
  {
    method: 'get',
    path: '/api/admin/edit-access',
    operationId: 'getAdminEditAccess',
    summary: '管理編集権限を確認する',
    tags: ['Admin'],
    parameters: [parameter('X-Admin-Edit-Key', 'header', '管理編集キー', true)],
    response: anyData,
  },
]

const apiResponse = (data: JsonObject) => ({
  type: 'object',
  required: ['data', 'meta'],
  properties: { data, meta: ref('Meta') },
})

const errorResponse = {
  description: 'エラー',
  content: { 'application/json': { schema: ref('ErrorResponse') } },
}

const pathItems: Record<string, JsonObject> = {
  ...Object.fromEntries(
    routes.map((route) => [
      route.path,
      {
        [route.method]: {
          operationId: route.operationId,
          summary: route.summary,
          tags: route.tags,
          ...(route.parameters ? { parameters: route.parameters } : {}),
          ...(route.requestBody ? { requestBody: route.requestBody } : {}),
          responses: {
            [route.status ?? 200]: {
              description: '成功',
              content: {
                'application/json': {
                  schema:
                    route.enveloped === false
                      ? (route.response ?? anyData)
                      : apiResponse(route.response ?? anyData),
                },
              },
            },
            400: errorResponse,
            401: errorResponse,
            404: errorResponse,
            500: errorResponse,
          },
        },
      },
    ]),
  ),
  '/api/openapi.json': {
    get: {
      operationId: 'getOpenApiDocument',
      summary: 'OpenAPI JSONを取得する',
      tags: ['Health'],
      responses: { 200: { description: 'OpenAPI 3.0.3 JSON' } },
    },
  },
  '/api/docs': {
    get: {
      operationId: 'getSwaggerUi',
      summary: 'Swagger UIを表示する',
      tags: ['Health'],
      responses: { 200: { description: 'Swagger UI HTML' } },
    },
  },
}

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'HAL Cinema back-api',
    version: '1.0.0',
    description: 'back-apiの実装ルートから生成したAPI仕様です。',
  },
  servers: [{ url: 'http://localhost:3000', description: 'ローカル開発環境' }],
  tags: [
    { name: 'Health', description: 'ヘルスチェック' },
    { name: 'Auth', description: '認証' },
    { name: 'Members', description: '会員' },
    { name: 'Movies', description: '映画' },
    { name: 'Stages', description: '舞台・イベント' },
    { name: 'Reservations', description: '予約' },
    { name: 'Screens', description: 'スクリーン' },
    { name: 'Products', description: '商品' },
    { name: 'POS', description: 'POS' },
    { name: 'Admin', description: '管理' },
    { name: 'Config', description: '設定' },
  ],
  paths: pathItems,
  components: {
    schemas: {
      Meta: {
        type: 'object',
        required: ['requestId'],
        properties: { requestId: { type: 'string' } },
      },
      ErrorResponse: {
        type: 'object',
        required: ['error', 'meta'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
          meta: ref('Meta'),
        },
      },
      CreateMemberRequest: {
        type: 'object',
        required: ['email'],
        properties: { email: { type: 'string', format: 'email' }, name: { type: 'string' } },
      },
      OtpSendRequest: {
        type: 'object',
        required: ['email', 'type'],
        properties: {
          email: { type: 'string', format: 'email' },
          type: { type: 'string', enum: ['login', 'register'] },
        },
      },
      OtpVerifyRequest: {
        type: 'object',
        required: ['email', 'code', 'type'],
        properties: {
          email: { type: 'string', format: 'email' },
          code: { type: 'string', minLength: 6, maxLength: 6 },
          type: { type: 'string', enum: ['login', 'register'] },
        },
      },
      QuoteRequest: {
        type: 'object',
        required: ['scheduleId', 'ticketCounts'],
        properties: {
          scheduleId: { type: 'integer', minimum: 1 },
          ticketCounts: {
            type: 'object',
            required: ['general', 'university', 'highschool', 'child'],
            properties: {
              general: { type: 'integer', minimum: 0 },
              university: { type: 'integer', minimum: 0 },
              highschool: { type: 'integer', minimum: 0 },
              child: { type: 'integer', minimum: 0 },
            },
          },
        },
      },
      HoldRequest: {
        type: 'object',
        required: ['scheduleId', 'seatIds'],
        properties: {
          scheduleId: { type: 'integer', minimum: 1 },
          seatIds: { type: 'array', items: { type: 'integer', minimum: 1 }, minItems: 1 },
        },
      },
      CreateReservationRequest: {
        type: 'object',
        required: ['scheduleId', 'layoutVersion', 'seatIds', 'bookingType', 'tickets', 'customer'],
        properties: {
          scheduleId: { type: 'integer', minimum: 1 },
          reservationCode: { type: 'string' },
          layoutVersion: { type: 'integer', minimum: 1 },
          seatIds: {
            type: 'array',
            items: { type: 'integer', minimum: 1 },
            minItems: 1,
            maxItems: 8,
          },
          bookingType: { type: 'string', enum: ['member', 'guest'] },
          tickets: {
            type: 'array',
            minItems: 1,
            maxItems: 8,
            items: {
              type: 'object',
              required: ['seatId', 'ticketType'],
              properties: {
                seatId: { type: 'integer', minimum: 1 },
                ticketType: {
                  type: 'string',
                  enum: ['general', 'university', 'highschool', 'child'],
                },
              },
            },
          },
          customer: {
            type: 'object',
            required: ['email'],
            properties: { email: { type: 'string', format: 'email' } },
          },
        },
      },
      CancelReservationRequest: {
        type: 'object',
        properties: { email: { type: 'string', format: 'email' } },
      },
      PosSaleRequest: {
        type: 'object',
        required: ['items', 'paymentMethod'],
        properties: {
          items: { type: 'array', items: { type: 'object' }, minItems: 1 },
          paymentMethod: { type: 'string', enum: ['cash', 'card', 'qr'] },
        },
      },
      AdminEditKeyRequest: {
        type: 'object',
        properties: {},
      },
      Member: {
        type: 'object',
        required: ['id', 'email'],
        properties: {
          id: { type: 'integer' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string', nullable: true },
        },
      },
      Movie: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' },
          description: { type: 'string' },
          durationMin: { type: 'integer' },
          status: { type: 'string' },
          thumbnailUrl: { type: 'string', nullable: true },
        },
      },
      MovieList: { type: 'object', properties: { items: { type: 'array', items: ref('Movie') } } },
      MovieSchedules: {
        type: 'object',
        properties: { movie: ref('Movie'), schedules: { type: 'array', items: ref('Schedule') } },
      },
      Stage: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          type: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          durationMin: { type: 'integer' },
          status: { type: 'string' },
        },
      },
      StageList: { type: 'object', properties: { items: { type: 'array', items: ref('Stage') } } },
      StageSchedules: {
        type: 'object',
        properties: { stage: ref('Stage'), schedules: { type: 'array', items: ref('Schedule') } },
      },
      Schedule: {
        type: 'object',
        properties: {
          scheduleId: { type: 'integer' },
          startsAt: { type: 'string', format: 'date-time' },
          endsAt: { type: 'string', format: 'date-time' },
          screenName: { type: 'string' },
          remainingSeats: { type: 'integer' },
          totalSeats: { type: 'integer' },
        },
      },
      SeatMap: { type: 'object', additionalProperties: true },
      Quote: { type: 'object', additionalProperties: true },
      ReservationHold: {
        type: 'object',
        properties: {
          reservationCode: { type: 'string' },
          expiresAt: { type: 'string', format: 'date-time' },
        },
      },
      Reservation: { type: 'object', additionalProperties: true },
      ReservationList: {
        type: 'object',
        properties: { items: { type: 'array', items: ref('Reservation') } },
      },
      Config: {
        type: 'object',
        properties: { tickets: { type: 'array', items: { type: 'object' } } },
      },
    },
  },
} as const
