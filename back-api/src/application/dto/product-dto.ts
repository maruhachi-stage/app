import type { ProductCategory } from '#domain/entities/product.js'

export type ListProductsQueryDTO = { category?: ProductCategory }
export type ProductDTO = {
  id: string; name: string; category: ProductCategory; price: number
  description?: string; imageUrl?: string; movieTitle?: string; isNew?: boolean; isSoldOut?: boolean
  optionGroups?: Array<{ id: string; name: string; required?: boolean; options: Array<{ id: string; label: string; priceDelta?: number }> }>
  notes?: string[]
}
export type ProductListResponseDTO = { items: ProductDTO[] }
