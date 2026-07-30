import type { ProductCategory } from '#domain/entities/product.js'

export type PosProduct = {
  id: number
  slug: string
  name: string
  category: ProductCategory
  price: number
  imagePath: string | null
  stockQuantity: number | null
  isActive: boolean
}
