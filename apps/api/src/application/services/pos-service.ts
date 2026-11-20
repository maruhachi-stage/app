import type {
  CreatePosSaleRequestDTO,
  CreatePosSaleResponseDTO,
  PosProductListResponseDTO,
  PosSaleListResponseDTO,
} from '#application/dto/pos-dto.js'
import type { PosRepository } from '#domain/interfaces/repositories/pos-repository.js'
import { imageUrl } from '#lib/format.js'

export class PosService {
  constructor(private readonly repository: PosRepository) {}
  async listProducts(): Promise<PosProductListResponseDTO> {
    return {
      items: (await this.repository.findProducts()).map((product) => {
        const image = imageUrl(product.imagePath)
        return {
          id: product.id,
          slug: product.slug,
          name: product.name,
          category: product.category,
          price: product.price,
          ...(image ? { imageUrl: image } : {}),
          stockQuantity: product.stockQuantity,
          isActive: product.isActive,
        }
      }),
    }
  }
  async listSales(limit: number): Promise<PosSaleListResponseDTO> {
    return {
      items: (await this.repository.findSales(limit)).map((sale) => ({
        id: sale.id,
        saleCode: sale.saleCode,
        totalAmount: sale.totalAmount,
        paymentMethod: sale.paymentMethod,
        createdAt: sale.createdAt,
      })),
    }
  }
  async createSale(request: CreatePosSaleRequestDTO): Promise<CreatePosSaleResponseDTO> {
    return this.repository.createSale(request)
  }
}
