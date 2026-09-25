import { asc, desc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '#infrastructure/database/sqlite.js'
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
      .orderBy(
        sql.raw(
          "CASE category WHEN 'food' THEN 0 WHEN 'drink' THEN 1 WHEN 'set' THEN 2 WHEN 'goods' THEN 3 ELSE 4 END",
        ),
        asc(posProducts.name),
      )
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
    const rows = await db.select().from(posSales).orderBy(desc(posSales.createdAt)).limit(limit)
    return rows.map((row) => ({
      id: row.id,
      saleCode: row.saleCode,
      totalAmount: row.totalAmount,
      paymentMethod: row.paymentMethod,
      createdAt: row.createdAt,
    }))
  }

  async createSale(params: Parameters<PosRepository['createSale']>[0]): Promise<CreatedPosSale> {
    const ids = [...new Set(params.items.map((item) => item.productId))]

    return db.transaction(
      (tx) => {
        const rows = ids.length
          ? tx.select().from(posProducts).where(inArray(posProducts.id, ids)).all()
          : []
        const products = new Map(rows.map((row) => [row.id, row]))
        const requestedQuantities = new Map<number, number>()
        for (const item of params.items) {
          requestedQuantities.set(
            item.productId,
            (requestedQuantities.get(item.productId) ?? 0) + item.quantity,
          )
        }

        let totalAmount = 0
        for (const item of params.items) {
          const product = products.get(item.productId)
          if (!product || !product.isActive) {
            throw new AppError('VALIDATION_ERROR', 'Product is unavailable')
          }
          totalAmount += product.price * item.quantity
        }

        for (const [productId, quantity] of requestedQuantities) {
          const product = products.get(productId)!
          if (product.stockQuantity !== null && product.stockQuantity < quantity) {
            throw new AppError('VALIDATION_ERROR', product.name + ' is out of stock')
          }
        }

        const saleCode = 'R' + Date.now().toString().slice(-8)
        const sale = tx
          .insert(posSales)
          .values({ saleCode, totalAmount, paymentMethod: params.paymentMethod })
          .returning({ id: posSales.id })
          .get()
        if (!sale) throw new Error('Failed to create POS sale')

        for (const item of params.items) {
          const product = products.get(item.productId)!
          const unitPrice = product.price
          tx.insert(posSaleItems)
            .values({
              saleId: sale.id,
              productId: item.productId,
              productName: product.name,
              unitPrice,
              quantity: item.quantity,
              lineTotal: unitPrice * item.quantity,
            })
            .run()
        }

        for (const [productId, quantity] of requestedQuantities) {
          const product = products.get(productId)!
          if (product.stockQuantity !== null) {
            tx.update(posProducts)
              .set({ stockQuantity: product.stockQuantity - quantity })
              .where(eq(posProducts.id, productId))
              .run()
          }
        }

        return { saleCode, totalAmount }
      },
      { behavior: 'immediate' },
    )
  }
}
