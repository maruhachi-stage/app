import type { Product, ProductCategory } from '#domain/entities/product.js'

export interface ProductRepository {
  findAll(category?: ProductCategory): Promise<Product[]>
  findById(productId: string): Promise<Product | null>
}
