import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

const timestamp = (name: string) => integer(name, { mode: 'timestamp_ms' }).notNull().defaultNow()

const updatedTimestamp = (name: string) => timestamp(name).$onUpdateFn(() => new Date())

export const otpPurposeValues = ['login', 'register'] as const
export const screenSizeValues = ['large', 'medium', 'small'] as const
export const screeningTypeValues = ['movie', 'stage', 'event'] as const
export const screeningStatusValues = ['now_showing', 'coming_soon'] as const
export const reservationBookingTypeValues = ['member', 'guest'] as const
export const reservationStatusValues = ['pending', 'confirmed', 'cancelled'] as const
export const ticketTypeValues = ['general', 'university', 'highschool', 'child'] as const
export const productCategoryValues = ['goods', 'food', 'drink', 'set'] as const
export const paymentMethodValues = ['cash', 'card', 'qr'] as const

export const members = sqliteTable(
  'members',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    email: text('email').notNull(),
    name: text('name'),
    createdAt: timestamp('created_at'),
    updatedAt: updatedTimestamp('updated_at'),
  },
  (table) => [uniqueIndex('uq_members_email').on(table.email)],
)

export const otpTokens = sqliteTable(
  'otp_tokens',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    memberId: integer('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    purpose: text('purpose', { enum: otpPurposeValues }).notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    usedAt: integer('used_at', { mode: 'timestamp_ms' }),
    failedAttempts: integer('failed_attempts').notNull().default(0),
    lockedUntil: integer('locked_until', { mode: 'timestamp_ms' }),
    createdAt: timestamp('created_at'),
    updatedAt: updatedTimestamp('updated_at'),
  },
  (table) => [
    index('idx_otp_member').on(table.memberId, table.purpose, table.createdAt),
    index('idx_otp_expires').on(table.expiresAt),
  ],
)

export const screens = sqliteTable('screens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  size: text('size', { enum: screenSizeValues }).notNull(),
  totalSeats: integer('total_seats').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: updatedTimestamp('updated_at'),
})

export const screenings = sqliteTable(
  'screenings',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    type: text('type', { enum: screeningTypeValues }).notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    durationMin: integer('duration_min').notNull(),
    status: text('status', { enum: screeningStatusValues }).notNull(),
    playwright: text('playwright'),
    director: text('director'),
    createdAt: timestamp('created_at'),
    updatedAt: updatedTimestamp('updated_at'),
  },
  (table) => [
    index('idx_screenings_title').on(table.title),
    index('idx_screenings_type').on(table.type),
    index('idx_screenings_status').on(table.status),
  ],
)

// This is deliberately a polymorphic association: entityType/entityId have no database FK.
export const images = sqliteTable(
  'images',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    entityType: text('entity_type').notNull(),
    entityId: integer('entity_id').notNull(),
    fileName: text('file_name').notNull(),
    displayOrder: integer('display_order').notNull().default(1),
    createdAt: timestamp('created_at'),
  },
  (table) => [index('idx_images_entity').on(table.entityType, table.entityId, table.displayOrder)],
)

export const schedules = sqliteTable(
  'schedules',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    screeningId: integer('screening_id')
      .notNull()
      .references(() => screenings.id, { onDelete: 'restrict' }),
    screenId: integer('screen_id')
      .notNull()
      .references(() => screens.id, { onDelete: 'restrict' }),
    startsAt: integer('starts_at', { mode: 'timestamp_ms' }).notNull(),
    endsAt: integer('ends_at', { mode: 'timestamp_ms' }).notNull(),
    isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(true),
    createdAt: timestamp('created_at'),
    updatedAt: updatedTimestamp('updated_at'),
  },
  (table) => [index('idx_schedules_starts_at').on(table.startsAt)],
)

export const screenSeatLayouts = sqliteTable(
  'screen_seat_layouts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    screenId: integer('screen_id')
      .notNull()
      .references(() => screens.id, { onDelete: 'restrict' }),
    layoutVersion: integer('layout_version').notNull().default(1),
    backgroundImageUrl: text('background_image_url').notNull(),
    aspectRatioWidth: integer('aspect_ratio_width').notNull(),
    aspectRatioHeight: integer('aspect_ratio_height').notNull(),
    createdAt: timestamp('created_at'),
    updatedAt: updatedTimestamp('updated_at'),
  },
  (table) => [uniqueIndex('uq_ssl_screen').on(table.screenId)],
)

export const seats = sqliteTable(
  'seats',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    screenId: integer('screen_id')
      .notNull()
      .references(() => screens.id, { onDelete: 'restrict' }),
    seatLayoutId: integer('seat_layout_id')
      .notNull()
      .references(() => screenSeatLayouts.id, { onDelete: 'cascade' }),
    rowLabel: text('row_label').notNull(),
    colNo: integer('col_no').notNull(),
    positionTopPct: real('position_top_pct').notNull(),
    positionLeftPct: real('position_left_pct').notNull(),
    seatWidthPct: real('seat_width_pct').notNull(),
    seatHeightPct: real('seat_height_pct').notNull(),
    hitRadiusPct: real('hit_radius_pct'),
    createdAt: timestamp('created_at'),
  },
  (table) => [
    uniqueIndex('uq_seats_screen_row_col').on(table.screenId, table.rowLabel, table.colNo),
  ],
)

export const reservations = sqliteTable(
  'reservations',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    reservationCode: text('reservation_code').notNull(),
    scheduleId: integer('schedule_id')
      .notNull()
      .references(() => schedules.id, { onDelete: 'restrict' }),
    memberId: integer('member_id').references(() => members.id, { onDelete: 'restrict' }),
    bookingType: text('booking_type', { enum: reservationBookingTypeValues })
      .notNull()
      .default('member'),
    customerName: text('customer_name'),
    customerEmail: text('customer_email'),
    status: text('status', { enum: reservationStatusValues }).notNull().default('confirmed'),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }),
    totalPrice: integer('total_price').notNull(),
    createdAt: timestamp('created_at'),
    updatedAt: updatedTimestamp('updated_at'),
  },
  (table) => [
    uniqueIndex('uq_reservation_code').on(table.reservationCode),
    index('idx_reservations_member').on(table.memberId, table.createdAt),
  ],
)

export const reservationSeats = sqliteTable(
  'reservation_seats',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    reservationId: integer('reservation_id')
      .notNull()
      .references(() => reservations.id, { onDelete: 'cascade' }),
    scheduleId: integer('schedule_id')
      .notNull()
      .references(() => schedules.id, { onDelete: 'restrict' }),
    seatId: integer('seat_id')
      .notNull()
      .references(() => seats.id, { onDelete: 'restrict' }),
    ticketType: text('ticket_type', { enum: ticketTypeValues }).notNull(),
    price: integer('price').notNull(),
    createdAt: timestamp('created_at'),
  },
  (table) => [uniqueIndex('uq_rs_schedule_seat').on(table.scheduleId, table.seatId)],
)

export const products = sqliteTable(
  'products',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    category: text('category', { enum: productCategoryValues }).notNull(),
    price: integer('price').notNull(),
    description: text('description'),
    imageUrl: text('image_url'),
    movieTitle: text('movie_title'),
    isNew: integer('is_new', { mode: 'boolean' }).notNull().default(false),
    isSoldOut: integer('is_sold_out', { mode: 'boolean' }).notNull().default(false),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at'),
    updatedAt: updatedTimestamp('updated_at'),
  },
  (table) => [
    index('idx_products_category').on(table.category),
    index('idx_products_display_order').on(table.displayOrder),
  ],
)

export const productOptionGroups = sqliteTable(
  'product_option_groups',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    groupKey: text('group_key').notNull(),
    name: text('name').notNull(),
    required: integer('required', { mode: 'boolean' }).notNull().default(false),
    displayOrder: integer('display_order').notNull().default(0),
  },
  (table) => [uniqueIndex('uq_product_option_groups_key').on(table.productId, table.groupKey)],
)

export const productOptions = sqliteTable(
  'product_options',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    groupId: integer('group_id')
      .notNull()
      .references(() => productOptionGroups.id, { onDelete: 'cascade' }),
    optionKey: text('option_key').notNull(),
    label: text('label').notNull(),
    priceDelta: integer('price_delta').notNull().default(0),
    displayOrder: integer('display_order').notNull().default(0),
  },
  (table) => [uniqueIndex('uq_product_options_key').on(table.groupId, table.optionKey)],
)

export const productNotes = sqliteTable('product_notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  note: text('note').notNull(),
  displayOrder: integer('display_order').notNull().default(0),
})

export const posProducts = sqliteTable(
  'pos_products',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    category: text('category', { enum: productCategoryValues }).notNull(),
    price: integer('price').notNull(),
    imageUrl: text('image_url'),
    stockQuantity: integer('stock_quantity'),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    createdAt: timestamp('created_at'),
    updatedAt: updatedTimestamp('updated_at'),
  },
  (table) => [
    uniqueIndex('uq_pos_products_slug').on(table.slug),
    index('idx_pos_products_category').on(table.category),
  ],
)

export const posSales = sqliteTable(
  'pos_sales',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    saleCode: text('sale_code').notNull(),
    totalAmount: integer('total_amount').notNull(),
    paymentMethod: text('payment_method', { enum: paymentMethodValues }).notNull(),
    createdAt: timestamp('created_at'),
  },
  (table) => [
    uniqueIndex('uq_pos_sales_code').on(table.saleCode),
    index('idx_pos_sales_created_at').on(table.createdAt),
  ],
)

export const posSaleItems = sqliteTable(
  'pos_sale_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    saleId: integer('sale_id')
      .notNull()
      .references(() => posSales.id, { onDelete: 'cascade' }),
    productId: integer('product_id')
      .notNull()
      .references(() => posProducts.id, { onDelete: 'restrict' }),
    productName: text('product_name').notNull(),
    unitPrice: integer('unit_price').notNull(),
    quantity: integer('quantity').notNull(),
    lineTotal: integer('line_total').notNull(),
    createdAt: timestamp('created_at'),
  },
  (table) => [index('idx_pos_sale_items_sale').on(table.saleId)],
)
