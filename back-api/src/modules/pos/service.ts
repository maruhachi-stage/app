import type mysql from 'mysql2/promise'
import { pool } from '#db/client.js'
import { AppError } from '#lib/errors.js'

export type PosProductRow = {
  id: number
  slug: string
  name: string
  category: 'goods' | 'food' | 'drink' | 'set'
  price: number
  image_url: string | null
  stock_quantity: number | null
  is_active: number
}

export type PosSaleItemInput = {
  productId: number
  quantity: number
}

export type PosSaleRow = {
  id: number
  sale_code: string
  total_amount: number
  payment_method: string
  created_at: Date | string
}

const PRODUCT_IMAGE_DIR = 'products'

const INITIAL_PRODUCTS = [
  ['salt-popcorn', 'シアターポップコーン', 'food', 700, 'salt-popcorn.webp', 120],
  ['caramel-popcorn', 'キャラメルポップコーン', 'food', 820, 'caramel-popcorn.webp', 90],
  ['cola-duo', 'クラフトコーラ', 'drink', 420, 'cola-duo.webp', 160],
  ['berry-soda', 'ベリーソーダ', 'drink', 460, 'berry-soda.webp', 140],
  ['popcorn-drink-set', 'ポップコーンセット', 'set', 1080, 'popcorn-drink-set.webp', 80],
  ['pair-drink-set', 'ペアドリンクセット', 'set', 780, 'pair-drink-set.webp', 0],
  ['night-stand', 'ナイトシティ アクリルスタンド', 'goods', 1800, 'night-stand.webp', 35],
  ['moon-file-set', 'ムーンライト クリアファイルセット', 'goods', 600, 'moon-file-set.webp', 60],
  ['black-poster', 'ティザーポスター B3', 'goods', 900, 'black-poster.webp', 42],
  ['premiere-ticket-holder', 'プレミアチケットホルダー', 'goods', 1200, 'premiere-ticket-holder.webp', 50],
  ['storyboard-book', 'ミニアートブック', 'goods', 2400, 'storyboard-book.webp', 0],
  ['screen-pin', 'スクリーンピンズ', 'goods', 750, 'screen-pin.webp', 75],
] as const

export async function ensurePosSchema(): Promise<void> {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS pos_products (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      slug VARCHAR(80) NOT NULL,
      name VARCHAR(160) NOT NULL,
      category ENUM('goods','food','drink','set') NOT NULL,
      price INT UNSIGNED NOT NULL,
      image_url VARCHAR(500) NULL,
      stock_quantity INT UNSIGNED NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_pos_products_slug (slug),
      KEY idx_pos_products_category (category)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS pos_sales (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      sale_code VARCHAR(16) NOT NULL,
      total_amount INT UNSIGNED NOT NULL,
      payment_method ENUM('cash','card','qr') NOT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY uq_pos_sales_code (sale_code),
      KEY idx_pos_sales_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS pos_sale_items (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      sale_id BIGINT UNSIGNED NOT NULL,
      product_id BIGINT UNSIGNED NOT NULL,
      product_name VARCHAR(160) NOT NULL,
      unit_price INT UNSIGNED NOT NULL,
      quantity INT UNSIGNED NOT NULL,
      line_total INT UNSIGNED NOT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      KEY idx_pos_sale_items_sale (sale_id),
      CONSTRAINT fk_pos_sale_items_sale FOREIGN KEY (sale_id) REFERENCES pos_sales (id) ON DELETE CASCADE,
      CONSTRAINT fk_pos_sale_items_product FOREIGN KEY (product_id) REFERENCES pos_products (id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  for (const [slug, name, category, price, imageFile, stockQuantity] of INITIAL_PRODUCTS) {
    await pool.execute(
      `INSERT INTO pos_products (slug, name, category, price, image_url, stock_quantity, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         category = VALUES(category),
         price = VALUES(price),
         image_url = VALUES(image_url)`,
      [
        slug,
        name,
        category,
        price,
        `${PRODUCT_IMAGE_DIR}/${imageFile}`,
        stockQuantity,
        stockQuantity > 0 ? 1 : 0,
      ],
    )
  }
}

export async function listProducts(): Promise<PosProductRow[]> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT id, slug, name, category, price, image_url, stock_quantity, is_active
     FROM pos_products
     ORDER BY FIELD(category, 'food', 'drink', 'set', 'goods'), name`,
  )
  return rows as PosProductRow[]
}

export async function listSales(limit: number): Promise<PosSaleRow[]> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT id, sale_code, total_amount, payment_method, created_at
     FROM pos_sales
     ORDER BY created_at DESC
     LIMIT ?`,
    [limit],
  )
  return rows as PosSaleRow[]
}

export async function createSale(params: {
  items: PosSaleItemInput[]
  paymentMethod: 'cash' | 'card' | 'qr'
}): Promise<{ saleCode: string; totalAmount: number }> {
  const productIds = params.items.map((item) => item.productId)
  const placeholders = productIds.map(() => '?').join(',')

  const conn = await pool.getConnection()
  await conn.beginTransaction()

  try {
    const [productRows] = await conn.execute<mysql.RowDataPacket[]>(
      `SELECT id, name, price, stock_quantity, is_active
       FROM pos_products
       WHERE id IN (${placeholders})
       FOR UPDATE`,
      productIds,
    )

    const products = new Map(productRows.map((row) => [Number(row.id), row]))
    let totalAmount = 0

    for (const item of params.items) {
      const product = products.get(item.productId)
      if (!product || Number(product.is_active) !== 1) {
        throw new AppError('VALIDATION_ERROR', '販売できない商品が含まれています')
      }
      const stockQuantity = product.stock_quantity == null ? null : Number(product.stock_quantity)
      if (stockQuantity !== null && stockQuantity < item.quantity) {
        throw new AppError('VALIDATION_ERROR', `${product.name} の在庫が不足しています`)
      }
      totalAmount += Number(product.price) * item.quantity
    }

    const saleCode = `R${Date.now().toString().slice(-8)}`
    const [saleResult] = await conn.execute<mysql.ResultSetHeader>(
      `INSERT INTO pos_sales (sale_code, total_amount, payment_method)
       VALUES (?, ?, ?)`,
      [saleCode, totalAmount, params.paymentMethod],
    )
    const saleId = saleResult.insertId

    for (const item of params.items) {
      const product = products.get(item.productId)!
      const unitPrice = Number(product.price)
      await conn.execute(
        `INSERT INTO pos_sale_items (sale_id, product_id, product_name, unit_price, quantity, line_total)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [saleId, item.productId, product.name, unitPrice, item.quantity, unitPrice * item.quantity],
      )
      if (product.stock_quantity != null) {
        await conn.execute(
          `UPDATE pos_products
           SET stock_quantity = stock_quantity - ?
           WHERE id = ?`,
          [item.quantity, item.productId],
        )
      }
    }

    await conn.commit()
    return { saleCode, totalAmount }
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}
