import { and, asc, desc, eq, gte, inArray, sql } from 'drizzle-orm'
import type { BatchItem } from 'drizzle-orm/batch'
import type { Database } from '#infrastructure/database/database.js'
import { posProducts, posSaleItems, posSales } from '#infrastructure/database/schema.js'
import { AppError } from '#domain/errors/appError.js'
import type { CreatedPosSale, PosSale } from '#domain/entities/pos-sale.js'
import type { PosProduct } from '#domain/entities/pos-product.js'
import type { PosRepository } from '#domain/interfaces/repositories/pos-repository.js'

export class DrizzlePosRepository implements PosRepository {
  constructor(private readonly db: Database) {}

  async findProducts(): Promise<PosProduct[]> {
    const rows = await this.db
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
    const rows = await this.db
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
    const ids = [...new Set(params.items.map((item) => item.productId))]

    const rows = ids.length
      ? await this.db.select().from(posProducts).where(inArray(posProducts.id, ids))
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

    // Stock is decremented with a conditional UPDATE and sent as one atomic
    // batch, so two concurrent sales cannot oversell the same inventory.
    const stockUpdates: BatchItem<'sqlite'>[] = []
    for (const [productId, quantity] of requestedQuantities) {
      const product = products.get(productId)!
      if (product.stockQuantity === null) continue
      stockUpdates.push(
        this.db
          .update(posProducts)
          .set({ stockQuantity: sql`${posProducts.stockQuantity} - ${quantity}` })
          .where(and(eq(posProducts.id, productId), gte(posProducts.stockQuantity, quantity))),
      )
    }

    if (stockUpdates.length > 0) {
      const results = await this.db.batch(
        stockUpdates as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]],
      )
      const soldOut = results.some((result) => (result?.meta?.changes ?? 0) === 0)
      if (soldOut) throw new AppError('VALIDATION_ERROR', 'Product is out of stock')
    }

    const saleCode = 'R' + Date.now().toString().slice(-8)
    const sale = await this.db
      .insert(posSales)
      .values({ saleCode, totalAmount, paymentMethod: params.paymentMethod })
      .returning({ id: posSales.id })
      .get()
    if (!sale) throw new Error('Failed to create POS sale')

    await this.db.insert(posSaleItems).values(
      params.items.map((item) => {
        const product = products.get(item.productId)!
        const unitPrice = product.price
        return {
          saleId: sale.id,
          productId: item.productId,
          productName: product.name,
          unitPrice,
          quantity: item.quantity,
          lineTotal: unitPrice * item.quantity,
        }
      }),
    )

    return { saleCode, totalAmount }
  }
}
