import type { PaymentMethod } from '#domain/entities/pos-sale.js'
import type { ProductCategory } from '#domain/entities/product.js'

export type PosProductDTO = { id: number; slug: string; name: string; category: ProductCategory; price: number; imageUrl?: string; stockQuantity: number | null; isActive: boolean }
export type PosProductListResponseDTO = { items: PosProductDTO[] }
export type PosSaleDTO = { id: number; saleCode: string; totalAmount: number; paymentMethod: string; createdAt: Date | string }
export type PosSaleListResponseDTO = { items: PosSaleDTO[] }
export type CreatePosSaleRequestDTO = { paymentMethod: PaymentMethod; items: Array<{ productId: number; quantity: number }> }
export type CreatePosSaleResponseDTO = { saleCode: string; totalAmount: number }
