import { asc, desc, inArray, sql } from 'drizzle-orm'
import { db } from '#infrastructure/database/mysqlPool.js'
import { posProducts, posSaleItems, posSales } from '#infrastructure/database/schema.js'
import { AppError } from '#domain/errors/appError.js'
import type { CreatedPosSale, PosSale } from '#domain/entities/pos-sale.js'
import type { PosProduct } from '#domain/entities/pos-product.js'
import type { PosRepository } from '#domain/interfaces/repositories/pos-repository.js'

export class DrizzlePosRepository implements PosRepository {
  async findProducts(): Promise<PosProduct[]> {
    const rows = await db
      .select()
      .from(posProducts)
      .orderBy(sql`FIELD(${posProducts.category}, 'food', 'drink', 'set', 'goods')`, asc(posProducts.name))
    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      category: row.category,
      price: row.price,
      imagePath: row.imageUrl,
      stockQuantity: row.stockQuantity,
      isActive: row.isActive,
    }))
  }

  async findSales(limit: number): Promise<PosSale[]> {
    const rows = await db
      .select()
      .from(posSales)
      .orderBy(desc(posSales.createdAt))
      .limit(limit)
    return rows.map((row) => ({
      id: row.id,
      saleCode: row.saleCode,
      totalAmount: row.totalAmount,
      paymentMethod: row.paymentMethod,
      createdAt: row.createdAt,
    }))
  }

  async createSale(params: Parameters<PosRepository['createSale']>[0]): Promise<CreatedPosSale> {
    const ids = params.items.map((item) => item.productId)

    return db.transaction(async (tx) => {
      // Lock the selected inventory rows until both sale records and stock updates commit.
      const rows = ids.length
        ? await tx.select().from(posProducts).where(inArray(posProducts.id, ids)).for('update')
        : []
      const products = new Map(rows.map((row) => [row.id, row]))
      let totalAmount = 0

      for (const item of params.items) {
        const product = products.get(item.productId)
        if (!product || !product.isActive) throw new AppError('VALIDATION_ERROR', 'Product is unavailable')
        const stock = product.stockQuantity
        if (stock !== null && stock < item.quantity) {
          throw new AppError('VALIDATION_ERROR', `${product.name} is out of stock`)
        }
        totalAmount += product.price * item.quantity
      }

      const saleCode = `R${Date.now().toString().slice(-8)}`
      const [sale] = await tx
        .insert(posSales)
        .values({ saleCode, totalAmount, paymentMethod: params.paymentMethod })
        .$returningId()

      for (const item of params.items) {
        const product = products.get(item.productId)!
        const unitPrice = product.price
        await tx.insert(posSaleItems).values({
          saleId: sale.id,
          productId: item.productId,
          productName: product.name,
          unitPrice,
          quantity: item.quantity,
          lineTotal: unitPrice * item.quantity,
        })
        if (product.stockQuantity !== null) {
          await tx
            .update(posProducts)
            .set({ stockQuantity: sql`${posProducts.stockQuantity} - ${item.quantity}` })
            .where(inArray(posProducts.id, [item.productId]))
        }
      }

      return { saleCode, totalAmount }
    })
  }
}
