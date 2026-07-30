import { sql } from 'drizzle-orm'
import { db } from '#infrastructure/database/mysqlPool.js'
import { posProducts } from '#infrastructure/database/schema.js'

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

// The name remains for compatibility with the startup sequence. Schema creation is
// exclusively handled by Drizzle migrations; this function only seeds the catalog.
export async function ensurePosSchema(): Promise<void> {
  for (const [slug, name, category, price, imageFile, stockQuantity] of INITIAL_PRODUCTS) {
    await db
      .insert(posProducts)
      .values({
        slug,
        name,
        category,
        price,
        imageUrl: `${PRODUCT_IMAGE_DIR}/${imageFile}`,
        stockQuantity,
        isActive: stockQuantity > 0,
      })
      .onDuplicateKeyUpdate({
        // Preserve the operational inventory state of existing catalog entries.
        set: {
          name: sql`VALUES(${posProducts.name})`,
          category: sql`VALUES(${posProducts.category})`,
          price: sql`VALUES(${posProducts.price})`,
          imageUrl: sql`VALUES(${posProducts.imageUrl})`,
        },
      })
  }
}
