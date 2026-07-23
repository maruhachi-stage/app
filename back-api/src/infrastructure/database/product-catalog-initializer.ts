// Product catalog seed synchronization. The schema is managed by Drizzle migrations.
import { and, asc, eq, inArray } from 'drizzle-orm'
import { db } from '#infrastructure/database/mysqlPool.js'
import { productNotes, productOptionGroups, productOptions, products } from '#infrastructure/database/schema.js'

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

const toProductRow = (row: Omit<ProductRow, 'is_new' | 'is_sold_out'> & { is_new: boolean; is_sold_out: boolean }): ProductRow => ({
  ...row,
  is_new: Number(row.is_new),
  is_sold_out: Number(row.is_sold_out),
})

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
  // Kept for compatibility with the application bootstrap. DDL belongs to Drizzle migrations.
  for (const [index, product] of SEED_PRODUCTS.entries()) {
    const productValues = {
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      description: product.description,
      imageUrl: `${PRODUCT_IMAGE_DIR}/${product.imageFile}`,
      movieTitle: product.movieTitle ?? null,
      isNew: product.isNew ?? false,
      isSoldOut: product.isSoldOut ?? false,
      displayOrder: index,
    }
    await db.insert(products).values(productValues).onDuplicateKeyUpdate({
      set: productValues,
    })

    for (const [groupIndex, group] of (product.optionGroups ?? []).entries()) {
      const groupValues = {
        productId: product.id,
        groupKey: group.id,
        name: group.name,
        required: group.required ?? false,
        displayOrder: groupIndex,
      }
      await db.insert(productOptionGroups).values(groupValues).onDuplicateKeyUpdate({
        set: groupValues,
      })
      const persistedGroup = await db
        .select({ id: productOptionGroups.id })
        .from(productOptionGroups)
        .where(and(eq(productOptionGroups.productId, product.id), eq(productOptionGroups.groupKey, group.id)))
      if (!persistedGroup[0]) throw new Error(`Product option group was not persisted: ${product.id}/${group.id}`)
      for (const [optionIndex, option] of group.options.entries()) {
        const optionValues = {
          groupId: persistedGroup[0].id,
          optionKey: option.id,
          label: option.label,
          priceDelta: option.priceDelta ?? 0,
          displayOrder: optionIndex,
        }
        await db.insert(productOptions).values(optionValues).onDuplicateKeyUpdate({
          set: optionValues,
        })
      }
    }

    await db.delete(productNotes).where(eq(productNotes.productId, product.id))
    for (const [noteIndex, note] of (product.notes ?? []).entries()) {
      await db.insert(productNotes).values({ productId: product.id, note, displayOrder: noteIndex })
    }
  }
}

export async function getProducts(category?: ProductCategory): Promise<ProductRow[]> {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      category: products.category,
      price: products.price,
      description: products.description,
      image_url: products.imageUrl,
      movie_title: products.movieTitle,
      is_new: products.isNew,
      is_sold_out: products.isSoldOut,
    })
    .from(products)
    .where(category ? eq(products.category, category) : undefined)
    .orderBy(asc(products.displayOrder))
  return rows.map(toProductRow)
}

export async function getProductById(productId: string): Promise<ProductRow | null> {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      category: products.category,
      price: products.price,
      description: products.description,
      image_url: products.imageUrl,
      movie_title: products.movieTitle,
      is_new: products.isNew,
      is_sold_out: products.isSoldOut,
    })
    .from(products)
    .where(eq(products.id, productId))
  return rows[0] ? toProductRow(rows[0]) : null
}

export async function getOptionGroups(productIds: string[]): Promise<ProductOptionGroupRow[]> {
  if (productIds.length === 0) return []
  const rows = await db
    .select({
      id: productOptionGroups.id,
      product_id: productOptionGroups.productId,
      group_key: productOptionGroups.groupKey,
      name: productOptionGroups.name,
      required: productOptionGroups.required,
    })
    .from(productOptionGroups)
    .where(inArray(productOptionGroups.productId, productIds))
    .orderBy(asc(productOptionGroups.displayOrder))
  return rows.map((row) => ({ ...row, required: Number(row.required) }))
}

export async function getOptions(groupIds: number[]): Promise<ProductOptionRow[]> {
  if (groupIds.length === 0) return []
  return db
    .select({
      group_id: productOptions.groupId,
      option_key: productOptions.optionKey,
      label: productOptions.label,
      price_delta: productOptions.priceDelta,
    })
    .from(productOptions)
    .where(inArray(productOptions.groupId, groupIds))
    .orderBy(asc(productOptions.displayOrder))
}

export async function getNotes(productIds: string[]): Promise<ProductNoteRow[]> {
  if (productIds.length === 0) return []
  return db
    .select({ product_id: productNotes.productId, note: productNotes.note })
    .from(productNotes)
    .where(inArray(productNotes.productId, productIds))
    .orderBy(asc(productNotes.displayOrder))
}
