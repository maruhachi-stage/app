import { sql } from 'drizzle-orm'
import {
  bigint,
  boolean,
  char,
  datetime,
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  smallint,
  text,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core'

const timestamp = () => datetime({ fsp: 3, mode: 'date' })
  .notNull()
  .default(sql`CURRENT_TIMESTAMP(3)`)

const updatedTimestamp = () => timestamp().$onUpdate(() => sql`CURRENT_TIMESTAMP(3)`)

export const otpPurposeValues = ['login', 'register'] as const
export const screenSizeValues = ['large', 'medium', 'small'] as const
export const screeningTypeValues = ['movie', 'stage', 'event'] as const
export const screeningStatusValues = ['now_showing', 'coming_soon'] as const
export const reservationBookingTypeValues = ['member', 'guest'] as const
export const reservationStatus = mysqlEnum('reservation_status', ['pending', 'confirmed', 'cancelled'])
export const ticketTypeValues = ['general', 'university', 'highschool', 'child'] as const
export const productCategoryValues = ['goods', 'food', 'drink', 'set'] as const
export const paymentMethodValues = ['cash', 'card', 'qr'] as const

export const members = mysqlTable('members', {
  id: bigint({ mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  email: varchar({ length: 254 }).notNull(),
  name: varchar({ length: 100 }),
  createdAt: timestamp(),
  updatedAt: updatedTimestamp(),
}, (table) => [
  uniqueIndex('uq_members_email').on(table.email),
])

export const otpTokens = mysqlTable('otp_tokens', {
  id: bigint({ mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  memberId: bigint('member_id', { mode: 'number', unsigned: true }).notNull().references(() => members.id, { onDelete: 'cascade' }),
  tokenHash: char('token_hash', { length: 64 }).notNull(),
  purpose: mysqlEnum('purpose', otpPurposeValues).notNull(),
  expiresAt: datetime('expires_at', { fsp: 3, mode: 'date' }).notNull(),
  usedAt: datetime('used_at', { fsp: 3, mode: 'date' }),
  failedAttempts: smallint('failed_attempts', { unsigned: true }).notNull().default(0),
  lockedUntil: datetime('locked_until', { fsp: 3, mode: 'date' }),
  createdAt: timestamp(),
  updatedAt: updatedTimestamp(),
}, (table) => [
  index('idx_otp_member').on(table.memberId, table.purpose, table.createdAt),
  index('idx_otp_expires').on(table.expiresAt),
])

export const screens = mysqlTable('screens', {
  id: bigint({ mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  name: varchar({ length: 50 }).notNull(),
  size: mysqlEnum('size', screenSizeValues).notNull(),
  totalSeats: int('total_seats', { unsigned: true }).notNull(),
  createdAt: timestamp(),
  updatedAt: updatedTimestamp(),
})

export const screenings = mysqlTable('screenings', {
  id: bigint({ mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  type: mysqlEnum('type', screeningTypeValues).notNull(),
  title: varchar({ length: 200 }).notNull(),
  description: text().notNull(),
  durationMin: smallint('duration_min', { unsigned: true }).notNull(),
  status: mysqlEnum('status', screeningStatusValues).notNull(),
  playwright: varchar({ length: 100 }),
  director: varchar({ length: 100 }),
  createdAt: timestamp(),
  updatedAt: updatedTimestamp(),
}, (table) => [
  index('idx_screenings_title').on(table.title),
  index('idx_screenings_type').on(table.type),
  index('idx_screenings_status').on(table.status),
])

// This is deliberately a polymorphic association: entityType/entityId have no database FK.
export const images = mysqlTable('images', {
  id: bigint({ mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: bigint('entity_id', { mode: 'number', unsigned: true }).notNull(),
  fileName: varchar('file_name', { length: 500 }).notNull(),
  displayOrder: int('display_order', { unsigned: true }).notNull().default(1),
  createdAt: timestamp(),
}, (table) => [
  index('idx_images_entity').on(table.entityType, table.entityId, table.displayOrder),
])

export const schedules = mysqlTable('schedules', {
  id: bigint({ mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  screeningId: bigint('screening_id', { mode: 'number', unsigned: true }).notNull().references(() => screenings.id, { onDelete: 'restrict' }),
  screenId: bigint('screen_id', { mode: 'number', unsigned: true }).notNull().references(() => screens.id, { onDelete: 'restrict' }),
  startsAt: datetime('starts_at', { fsp: 3, mode: 'date' }).notNull(),
  endsAt: datetime('ends_at', { fsp: 3, mode: 'date' }).notNull(),
  isPublic: boolean('is_public').notNull().default(true),
  createdAt: timestamp(),
  updatedAt: updatedTimestamp(),
}, (table) => [
  index('idx_schedules_starts_at').on(table.startsAt),
])

export const screenSeatLayouts = mysqlTable('screen_seat_layouts', {
  id: bigint({ mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  screenId: bigint('screen_id', { mode: 'number', unsigned: true }).notNull().references(() => screens.id, { onDelete: 'restrict' }),
  layoutVersion: int('layout_version', { unsigned: true }).notNull().default(1),
  backgroundImageUrl: varchar('background_image_url', { length: 500 }).notNull(),
  aspectRatioWidth: smallint('aspect_ratio_width', { unsigned: true }).notNull(),
  aspectRatioHeight: smallint('aspect_ratio_height', { unsigned: true }).notNull(),
  createdAt: timestamp(),
  updatedAt: updatedTimestamp(),
}, (table) => [
  uniqueIndex('uq_ssl_screen').on(table.screenId),
])

export const seats = mysqlTable('seats', {
  id: bigint({ mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  screenId: bigint('screen_id', { mode: 'number', unsigned: true }).notNull().references(() => screens.id, { onDelete: 'restrict' }),
  seatLayoutId: bigint('seat_layout_id', { mode: 'number', unsigned: true }).notNull().references(() => screenSeatLayouts.id, { onDelete: 'cascade' }),
  rowLabel: varchar('row_label', { length: 2 }).notNull(),
  colNo: smallint('col_no', { unsigned: true }).notNull(),
  positionTopPct: decimal('position_top_pct', { precision: 5, scale: 2 }).notNull(),
  positionLeftPct: decimal('position_left_pct', { precision: 5, scale: 2 }).notNull(),
  seatWidthPct: decimal('seat_width_pct', { precision: 5, scale: 2 }).notNull(),
  seatHeightPct: decimal('seat_height_pct', { precision: 5, scale: 2 }).notNull(),
  hitRadiusPct: decimal('hit_radius_pct', { precision: 5, scale: 2 }),
  createdAt: timestamp(),
}, (table) => [
  uniqueIndex('uq_seats_screen_row_col').on(table.screenId, table.rowLabel, table.colNo),
])

export const reservations = mysqlTable('reservations', {
  id: bigint({ mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  reservationCode: varchar('reservation_code', { length: 12 }).notNull(),
  scheduleId: bigint('schedule_id', { mode: 'number', unsigned: true }).notNull().references(() => schedules.id, { onDelete: 'restrict' }),
  memberId: bigint('member_id', { mode: 'number', unsigned: true }).references(() => members.id, { onDelete: 'restrict' }),
  bookingType: mysqlEnum('booking_type', reservationBookingTypeValues).notNull().default('member'),
  customerName: varchar('customer_name', { length: 100 }),
  customerEmail: varchar('customer_email', { length: 254 }),
  status: reservationStatus.notNull().default('confirmed'),
  expiresAt: datetime('expires_at', { fsp: 3, mode: 'date' }),
  totalPrice: int('total_price', { unsigned: true }).notNull(),
  createdAt: timestamp(),
  updatedAt: updatedTimestamp(),
}, (table) => [
  uniqueIndex('uq_reservation_code').on(table.reservationCode),
  index('idx_reservations_member').on(table.memberId, table.createdAt),
])

export const reservationSeats = mysqlTable('reservation_seats', {
  id: bigint({ mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  reservationId: bigint('reservation_id', { mode: 'number', unsigned: true }).notNull().references(() => reservations.id, { onDelete: 'cascade' }),
  scheduleId: bigint('schedule_id', { mode: 'number', unsigned: true }).notNull().references(() => schedules.id, { onDelete: 'restrict' }),
  seatId: bigint('seat_id', { mode: 'number', unsigned: true }).notNull().references(() => seats.id, { onDelete: 'restrict' }),
  ticketType: mysqlEnum('ticket_type', ticketTypeValues).notNull(),
  price: int({ unsigned: true }).notNull(),
  createdAt: timestamp(),
}, (table) => [
  uniqueIndex('uq_rs_schedule_seat').on(table.scheduleId, table.seatId),
])

export const products = mysqlTable('products', {
  id: varchar({ length: 80 }).primaryKey(),
  name: varchar({ length: 160 }).notNull(),
  category: mysqlEnum('category', productCategoryValues).notNull(),
  price: int({ unsigned: true }).notNull(),
  description: text(),
  imageUrl: varchar('image_url', { length: 500 }),
  movieTitle: varchar('movie_title', { length: 160 }),
  isNew: boolean('is_new').notNull().default(false),
  isSoldOut: boolean('is_sold_out').notNull().default(false),
  displayOrder: int('display_order', { unsigned: true }).notNull().default(0),
  createdAt: timestamp(),
  updatedAt: updatedTimestamp(),
}, (table) => [
  index('idx_products_category').on(table.category),
  index('idx_products_display_order').on(table.displayOrder),
])

export const productOptionGroups = mysqlTable('product_option_groups', {
  id: bigint({ mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  productId: varchar('product_id', { length: 80 }).notNull().references(() => products.id, { onDelete: 'cascade' }),
  groupKey: varchar('group_key', { length: 80 }).notNull(),
  name: varchar({ length: 120 }).notNull(),
  required: boolean().notNull().default(false),
  displayOrder: int('display_order', { unsigned: true }).notNull().default(0),
}, (table) => [
  uniqueIndex('uq_product_option_groups_key').on(table.productId, table.groupKey),
])

export const productOptions = mysqlTable('product_options', {
  id: bigint({ mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  groupId: bigint('group_id', { mode: 'number', unsigned: true }).notNull().references(() => productOptionGroups.id, { onDelete: 'cascade' }),
  optionKey: varchar('option_key', { length: 80 }).notNull(),
  label: varchar({ length: 120 }).notNull(),
  priceDelta: int('price_delta').notNull().default(0),
  displayOrder: int('display_order', { unsigned: true }).notNull().default(0),
}, (table) => [
  uniqueIndex('uq_product_options_key').on(table.groupId, table.optionKey),
])

export const productNotes = mysqlTable('product_notes', {
  id: bigint({ mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  productId: varchar('product_id', { length: 80 }).notNull().references(() => products.id, { onDelete: 'cascade' }),
  note: text().notNull(),
  displayOrder: int('display_order', { unsigned: true }).notNull().default(0),
})

export const posProducts = mysqlTable('pos_products', {
  id: bigint({ mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  slug: varchar({ length: 80 }).notNull(),
  name: varchar({ length: 160 }).notNull(),
  category: mysqlEnum('category', productCategoryValues).notNull(),
  price: int({ unsigned: true }).notNull(),
  imageUrl: varchar('image_url', { length: 500 }),
  stockQuantity: int('stock_quantity', { unsigned: true }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp(),
  updatedAt: updatedTimestamp(),
}, (table) => [
  uniqueIndex('uq_pos_products_slug').on(table.slug),
  index('idx_pos_products_category').on(table.category),
])

export const posSales = mysqlTable('pos_sales', {
  id: bigint({ mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  saleCode: varchar('sale_code', { length: 16 }).notNull(),
  totalAmount: int('total_amount', { unsigned: true }).notNull(),
  paymentMethod: mysqlEnum('payment_method', paymentMethodValues).notNull(),
  createdAt: timestamp(),
}, (table) => [
  uniqueIndex('uq_pos_sales_code').on(table.saleCode),
  index('idx_pos_sales_created_at').on(table.createdAt),
])

export const posSaleItems = mysqlTable('pos_sale_items', {
  id: bigint({ mode: 'number', unsigned: true }).autoincrement().primaryKey(),
  saleId: bigint('sale_id', { mode: 'number', unsigned: true }).notNull().references(() => posSales.id, { onDelete: 'cascade' }),
  productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull().references(() => posProducts.id, { onDelete: 'restrict' }),
  productName: varchar('product_name', { length: 160 }).notNull(),
  unitPrice: int('unit_price', { unsigned: true }).notNull(),
  quantity: int({ unsigned: true }).notNull(),
  lineTotal: int('line_total', { unsigned: true }).notNull(),
  createdAt: timestamp(),
}, (table) => [
  index('idx_pos_sale_items_sale').on(table.saleId),
])
