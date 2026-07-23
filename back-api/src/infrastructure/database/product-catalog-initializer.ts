// MySQL product catalog schema initialization and repository query support.
import type mysql from 'mysql2/promise'
import { mysqlPool as pool } from '#infrastructure/database/mysqlPool.js'

export type ProductCategory = 'goods' | 'food' | 'drink' | 'set'

export type ProductRow = {
  id: string
  name: string
  category: ProductCategory
  price: number
  description: string | null
  image_url: string | null
  movie_title: string | null
  is_new: number
  is_sold_out: number
}

export type ProductOptionGroupRow = {
  id: number
  product_id: string
  group_key: string
  name: string
  required: number
}

export type ProductOptionRow = {
  group_id: number
  option_key: string
  label: string
  price_delta: number
}

export type ProductNoteRow = {
  product_id: string
  note: string
}

const PRODUCT_IMAGE_DIR = 'products'

type SeedProduct = {
  id: string
  name: string
  category: ProductCategory
  price: number
  description: string
  imageFile: string
  movieTitle?: string
  isNew?: boolean
  isSoldOut?: boolean
  optionGroups?: Array<{
    id: string
    name: string
    required?: boolean
    options: Array<{ id: string; label: string; priceDelta?: number }>
  }>
  notes?: string[]
}

const SEED_PRODUCTS: SeedProduct[] = [
  {
    id: 'night-stand',
    name: 'ナイトシティ アクリルスタンド',
    category: 'goods',
    price: 1800,
    description: '作品ビジュアルを飾れる、透明感のある卓上アクリルスタンド。',
    imageFile: 'night-stand.webp',
    movieTitle: 'ナイトシティ・エコー',
    isNew: true,
    optionGroups: [
      {
        id: 'design',
        name: 'デザイン',
        required: true,
        options: [
          { id: 'hero', label: '主人公' },
          { id: 'poster', label: 'ポスタービジュアル' },
        ],
      },
    ],
  },
  {
    id: 'moon-file-set',
    name: 'ムーンライト クリアファイルセット',
    category: 'goods',
    price: 600,
    description: 'ポスターアートをまとめた劇場限定の2枚組ファイル。',
    imageFile: 'moon-file-set.webp',
    movieTitle: 'ナイトシティ・エコー',
  },
  {
    id: 'black-poster',
    name: 'ティザーポスター B3',
    category: 'goods',
    price: 900,
    description: 'ロビー掲出を意識した、深い色味のB3ポスター。',
    imageFile: 'black-poster.webp',
    movieTitle: '深夜上映コレクション',
  },
  {
    id: 'premiere-ticket-holder',
    name: 'プレミアチケットホルダー',
    category: 'goods',
    price: 1200,
    description: '半券と特典カードを一緒に保管できるホルダー。',
    imageFile: 'premiere-ticket-holder.webp',
    movieTitle: 'HAL Cinema',
  },
  {
    id: 'storyboard-book',
    name: 'ミニアートブック',
    category: 'goods',
    price: 2400,
    description: 'キービジュアルとコンセプト案を収録した小冊子。',
    imageFile: 'storyboard-book.webp',
    movieTitle: 'ナイトシティ・エコー',
    isSoldOut: true,
  },
  {
    id: 'screen-pin',
    name: 'スクリーンピンズ',
    category: 'goods',
    price: 750,
    description: 'シネマロゴを型取った小ぶりなメタルピンズ。',
    imageFile: 'screen-pin.webp',
    movieTitle: 'HAL Cinema',
  },
  {
    id: 'salt-popcorn',
    name: 'シアターポップコーン',
    category: 'food',
    price: 700,
    description: '上映前の定番。香ばしい塩バター仕立て。',
    imageFile: 'salt-popcorn.webp',
    isNew: true,
    optionGroups: [
      {
        id: 'flavor',
        name: '味',
        required: true,
        options: [
          { id: 'salt', label: '塩バター' },
          { id: 'cheese', label: 'チーズ', priceDelta: 80 },
          { id: 'mix', label: '塩バター&キャラメル', priceDelta: 120 },
        ],
      },
      {
        id: 'size',
        name: 'サイズ',
        required: true,
        options: [
          { id: 'm', label: 'M' },
          { id: 'l', label: 'L', priceDelta: 180 },
        ],
      },
    ],
    notes: ['レジ受け取り', 'アレルギー: 乳成分'],
  },
  {
    id: 'caramel-popcorn',
    name: 'キャラメルポップコーン',
    category: 'food',
    price: 820,
    description: '別添えソースで食感を残した甘いポップコーン。',
    imageFile: 'caramel-popcorn.webp',
    optionGroups: [
      {
        id: 'size',
        name: 'サイズ',
        required: true,
        options: [
          { id: 'm', label: 'M' },
          { id: 'l', label: 'L', priceDelta: 180 },
        ],
      },
      {
        id: 'topping',
        name: 'トッピング',
        options: [
          { id: 'none', label: 'なし' },
          { id: 'almond', label: 'クラッシュアーモンド', priceDelta: 120 },
        ],
      },
    ],
    notes: ['アレルギー: 乳成分・アーモンド'],
  },
  {
    id: 'cola-duo',
    name: 'クラフトコーラ',
    category: 'drink',
    price: 420,
    description: '氷感を残した劇場サイズのコールドドリンク。',
    imageFile: 'cola-duo.webp',
    optionGroups: [
      {
        id: 'size',
        name: 'サイズ',
        required: true,
        options: [
          { id: 'm', label: 'M' },
          { id: 'l', label: 'L', priceDelta: 120 },
        ],
      },
      {
        id: 'ice',
        name: '氷',
        required: true,
        options: [
          { id: 'normal', label: '通常' },
          { id: 'less', label: '少なめ' },
          { id: 'none', label: 'なし' },
        ],
      },
    ],
  },
  {
    id: 'berry-soda',
    name: 'ベリーソーダ',
    category: 'drink',
    price: 460,
    description: '赤い果実の香りが立つ炭酸ドリンク。',
    imageFile: 'berry-soda.webp',
    optionGroups: [
      {
        id: 'size',
        name: 'サイズ',
        required: true,
        options: [
          { id: 'm', label: 'M' },
          { id: 'l', label: 'L', priceDelta: 120 },
        ],
      },
    ],
  },
  {
    id: 'popcorn-drink-set',
    name: 'ポップコーンセット',
    category: 'set',
    price: 1080,
    description: 'ポップコーンとドリンクをまとめた上映前セット。',
    imageFile: 'popcorn-drink-set.webp',
    optionGroups: [
      {
        id: 'popcorn',
        name: 'ポップコーンの味',
        required: true,
        options: [
          { id: 'salt', label: '塩バター' },
          { id: 'caramel', label: 'キャラメル', priceDelta: 80 },
        ],
      },
      {
        id: 'drink',
        name: 'ドリンク',
        required: true,
        options: [
          { id: 'cola', label: 'クラフトコーラ' },
          { id: 'berry', label: 'ベリーソーダ', priceDelta: 40 },
          { id: 'tea', label: 'アイスティー' },
        ],
      },
    ],
    notes: ['セットは映画開始5分前までの受け取りがおすすめです'],
  },
  {
    id: 'pair-drink-set',
    name: 'ペアドリンクセット',
    category: 'set',
    price: 780,
    description: '2人で選べるドリンクのペアオーダー。',
    imageFile: 'pair-drink-set.webp',
    isSoldOut: true,
  },
]

export async function ensureProductCatalogSchema(): Promise<void> {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(80) NOT NULL,
      name VARCHAR(160) NOT NULL,
      category ENUM('goods','food','drink','set') NOT NULL,
      price INT UNSIGNED NOT NULL,
      description TEXT NULL,
      image_url VARCHAR(500) NULL,
      movie_title VARCHAR(160) NULL,
      is_new TINYINT(1) NOT NULL DEFAULT 0,
      is_sold_out TINYINT(1) NOT NULL DEFAULT 0,
      display_order INT UNSIGNED NOT NULL DEFAULT 0,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      KEY idx_products_category (category),
      KEY idx_products_display_order (display_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS product_option_groups (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      product_id VARCHAR(80) NOT NULL,
      group_key VARCHAR(80) NOT NULL,
      name VARCHAR(120) NOT NULL,
      required TINYINT(1) NOT NULL DEFAULT 0,
      display_order INT UNSIGNED NOT NULL DEFAULT 0,
      PRIMARY KEY (id),
      UNIQUE KEY uq_product_option_groups_key (product_id, group_key),
      CONSTRAINT fk_product_option_groups_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS product_options (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      group_id BIGINT UNSIGNED NOT NULL,
      option_key VARCHAR(80) NOT NULL,
      label VARCHAR(120) NOT NULL,
      price_delta INT NOT NULL DEFAULT 0,
      display_order INT UNSIGNED NOT NULL DEFAULT 0,
      PRIMARY KEY (id),
      UNIQUE KEY uq_product_options_key (group_id, option_key),
      CONSTRAINT fk_product_options_group FOREIGN KEY (group_id) REFERENCES product_option_groups (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS product_notes (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      product_id VARCHAR(80) NOT NULL,
      note TEXT NOT NULL,
      display_order INT UNSIGNED NOT NULL DEFAULT 0,
      PRIMARY KEY (id),
      CONSTRAINT fk_product_notes_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  for (const [index, product] of SEED_PRODUCTS.entries()) {
    await pool.execute(
      `INSERT INTO products
       (id, name, category, price, description, image_url, movie_title, is_new, is_sold_out, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         category = VALUES(category),
         price = VALUES(price),
         description = VALUES(description),
         image_url = VALUES(image_url),
         movie_title = VALUES(movie_title),
         is_new = VALUES(is_new),
         is_sold_out = VALUES(is_sold_out),
         display_order = VALUES(display_order)`,
      [
        product.id,
        product.name,
        product.category,
        product.price,
        product.description,
        `${PRODUCT_IMAGE_DIR}/${product.imageFile}`,
        product.movieTitle ?? null,
        product.isNew ? 1 : 0,
        product.isSoldOut ? 1 : 0,
        index,
      ],
    )

    for (const [groupIndex, group] of (product.optionGroups ?? []).entries()) {
      const [result] = await pool.execute<mysql.ResultSetHeader>(
        `INSERT INTO product_option_groups (product_id, group_key, name, required, display_order)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           id = LAST_INSERT_ID(id),
           name = VALUES(name),
           required = VALUES(required),
           display_order = VALUES(display_order)`,
        [product.id, group.id, group.name, group.required ? 1 : 0, groupIndex],
      )
      for (const [optionIndex, option] of group.options.entries()) {
        await pool.execute(
          `INSERT INTO product_options (group_id, option_key, label, price_delta, display_order)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             label = VALUES(label),
             price_delta = VALUES(price_delta),
             display_order = VALUES(display_order)`,
          [result.insertId, option.id, option.label, option.priceDelta ?? 0, optionIndex],
        )
      }
    }

    await pool.execute('DELETE FROM product_notes WHERE product_id = ?', [product.id])
    for (const [noteIndex, note] of (product.notes ?? []).entries()) {
      await pool.execute(
        `INSERT INTO product_notes (product_id, note, display_order)
         VALUES (?, ?, ?)`,
        [product.id, note, noteIndex],
      )
    }
  }
}

export async function getProducts(category?: ProductCategory): Promise<ProductRow[]> {
  const params: string[] = []
  let sql = `
    SELECT id, name, category, price, description, image_url, movie_title, is_new, is_sold_out
    FROM products
    WHERE 1 = 1`
  if (category) {
    sql += ' AND category = ?'
    params.push(category)
  }
  sql += ' ORDER BY display_order ASC'

  const [rows] = await pool.execute<mysql.RowDataPacket[]>(sql, params)
  return rows as ProductRow[]
}

export async function getProductById(productId: string): Promise<ProductRow | null> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT id, name, category, price, description, image_url, movie_title, is_new, is_sold_out
     FROM products
     WHERE id = ?`,
    [productId],
  )
  return (rows[0] as ProductRow) || null
}

export async function getOptionGroups(productIds: string[]): Promise<ProductOptionGroupRow[]> {
  if (productIds.length === 0) return []
  const placeholders = productIds.map(() => '?').join(',')
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT id, product_id, group_key, name, required
     FROM product_option_groups
     WHERE product_id IN (${placeholders})
     ORDER BY display_order ASC`,
    productIds,
  )
  return rows as ProductOptionGroupRow[]
}

export async function getOptions(groupIds: number[]): Promise<ProductOptionRow[]> {
  if (groupIds.length === 0) return []
  const placeholders = groupIds.map(() => '?').join(',')
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT group_id, option_key, label, price_delta
     FROM product_options
     WHERE group_id IN (${placeholders})
     ORDER BY display_order ASC`,
    groupIds,
  )
  return rows as ProductOptionRow[]
}

export async function getNotes(productIds: string[]): Promise<ProductNoteRow[]> {
  if (productIds.length === 0) return []
  const placeholders = productIds.map(() => '?').join(',')
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT product_id, note
     FROM product_notes
     WHERE product_id IN (${placeholders})
     ORDER BY display_order ASC`,
    productIds,
  )
  return rows as ProductNoteRow[]
}
