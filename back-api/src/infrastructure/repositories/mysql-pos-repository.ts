import type mysql from 'mysql2/promise'
import { mysqlPool } from '#infrastructure/database/mysqlPool.js'
import { AppError } from '#domain/errors/appError.js'
import type { CreatedPosSale, PosSale } from '#domain/entities/pos-sale.js'
import type { PosProduct } from '#domain/entities/pos-product.js'
import type { PosRepository } from '#domain/interfaces/repositories/pos-repository.js'
import type { ProductCategory } from '#domain/entities/product.js'

type ProductRow = mysql.RowDataPacket & { id: number; slug: string; name: string; category: ProductCategory; price: number; image_url: string | null; stock_quantity: number | null; is_active: number }
type SaleRow = mysql.RowDataPacket & { id: number; sale_code: string; total_amount: number; payment_method: 'cash' | 'card' | 'qr'; created_at: Date | string }

export class MysqlPosRepository implements PosRepository {
  async findProducts(): Promise<PosProduct[]> {
    const [rows] = await mysqlPool.execute<ProductRow[]>("SELECT id, slug, name, category, price, image_url, stock_quantity, is_active FROM pos_products ORDER BY FIELD(category, 'food', 'drink', 'set', 'goods'), name")
    return rows.map((row) => ({ id: Number(row.id), slug: row.slug, name: row.name, category: row.category, price: Number(row.price), imagePath: row.image_url, stockQuantity: row.stock_quantity == null ? null : Number(row.stock_quantity), isActive: Boolean(row.is_active) }))
  }
  async findSales(limit: number): Promise<PosSale[]> {
    const [rows] = await mysqlPool.execute<SaleRow[]>('SELECT id, sale_code, total_amount, payment_method, created_at FROM pos_sales ORDER BY created_at DESC LIMIT ?', [limit])
    return rows.map((row) => ({ id: Number(row.id), saleCode: row.sale_code, totalAmount: Number(row.total_amount), paymentMethod: row.payment_method, createdAt: row.created_at }))
  }
  async createSale(params: Parameters<PosRepository['createSale']>[0]): Promise<CreatedPosSale> {
    const ids = params.items.map((item) => item.productId)
    const conn = await mysqlPool.getConnection(); await conn.beginTransaction()
    try {
      const [rows] = await conn.execute<ProductRow[]>(`SELECT id, name, price, stock_quantity, is_active FROM pos_products WHERE id IN (${ids.map(() => '?').join(',')}) FOR UPDATE`, ids)
      const products = new Map(rows.map((row) => [Number(row.id), row])); let totalAmount = 0
      for (const item of params.items) {
        const product = products.get(item.productId)
        if (!product || Number(product.is_active) !== 1) throw new AppError('VALIDATION_ERROR', 'Product is unavailable')
        const stock = product.stock_quantity == null ? null : Number(product.stock_quantity)
        if (stock !== null && stock < item.quantity) throw new AppError('VALIDATION_ERROR', `${product.name} is out of stock`)
        totalAmount += Number(product.price) * item.quantity
      }
      const saleCode = `R${Date.now().toString().slice(-8)}`
      const [sale] = await conn.execute<mysql.ResultSetHeader>('INSERT INTO pos_sales (sale_code, total_amount, payment_method) VALUES (?, ?, ?)', [saleCode, totalAmount, params.paymentMethod])
      for (const item of params.items) {
        const product = products.get(item.productId)!; const unitPrice = Number(product.price)
        await conn.execute('INSERT INTO pos_sale_items (sale_id, product_id, product_name, unit_price, quantity, line_total) VALUES (?, ?, ?, ?, ?, ?)', [sale.insertId, item.productId, product.name, unitPrice, item.quantity, unitPrice * item.quantity])
        if (product.stock_quantity != null) await conn.execute('UPDATE pos_products SET stock_quantity = stock_quantity - ? WHERE id = ?', [item.quantity, item.productId])
      }
      await conn.commit(); return { saleCode, totalAmount }
    } catch (error) { await conn.rollback(); throw error } finally { conn.release() }
  }
}
