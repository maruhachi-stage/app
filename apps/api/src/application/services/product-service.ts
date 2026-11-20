import type {
  ListProductsQueryDTO,
  ProductDTO,
  ProductListResponseDTO,
} from '#application/dto/product-dto.js'
import type { Product } from '#domain/entities/product.js'
import type { ProductRepository } from '#domain/interfaces/repositories/product-repository.js'
import { imageUrl } from '#lib/format.js'

export class ProductService {
  constructor(private readonly repository: ProductRepository) {}
  async listProducts(query: ListProductsQueryDTO): Promise<ProductListResponseDTO> {
    return {
      items: (await this.repository.findAll(query.category)).map((product) => this.toDTO(product)),
    }
  }
  async getProduct(productId: string): Promise<ProductDTO | null> {
    const product = await this.repository.findById(productId)
    return product ? this.toDTO(product) : null
  }
  private toDTO(product: Product): ProductDTO {
    const image = imageUrl(product.imagePath)
    return {
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      ...(product.description ? { description: product.description } : {}),
      ...(image ? { imageUrl: image } : {}),
      ...(product.movieTitle ? { movieTitle: product.movieTitle } : {}),
      ...(product.isNew ? { isNew: true } : {}),
      ...(product.isSoldOut ? { isSoldOut: true } : {}),
      ...(product.optionGroups.length
        ? {
            optionGroups: product.optionGroups.map((group) => ({
              id: group.id,
              name: group.name,
              ...(group.required ? { required: true } : {}),
              options: group.options.map((option) => ({
                id: option.id,
                label: option.label,
                ...(option.priceDelta ? { priceDelta: option.priceDelta } : {}),
              })),
            })),
          }
        : {}),
      ...(product.notes.length ? { notes: product.notes } : {}),
    }
  }
}
