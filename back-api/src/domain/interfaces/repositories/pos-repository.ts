import type {
  CreatedPosSale,
  PaymentMethod,
  PosSale,
  PosSaleItem,
} from '#domain/entities/pos-sale.js'
import type { PosProduct } from '#domain/entities/pos-product.js'

export interface PosRepository {
  findProducts(): Promise<PosProduct[]>
  findSales(limit: number): Promise<PosSale[]>
  createSale(params: {
    items: PosSaleItem[]
    paymentMethod: PaymentMethod
  }): Promise<CreatedPosSale>
}
