import type {
  CreatePosSaleRequestDTO,
  CreatePosSaleResponseDTO,
  PosProductListResponseDTO,
  PosSaleListResponseDTO,
} from '#application/dto/pos-dto.js'
import type { PosRepository } from '#domain/interfaces/repositories/pos-repository.js'

export class PosService {
  constructor(
    private readonly repository: PosRepository,
    private readonly imageBaseUrl = process.env.IMAGE_BASE_URL ?? 'http://localhost:3001',
  ) {}
  async listProducts(): Promise<PosProductListResponseDTO> {
    return {
      items: (await this.repository.findProducts()).map((product) => ({
        id: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category,
        price: product.price,
        ...(this.imageUrl(product.imagePath) ? { imageUrl: this.imageUrl(product.imagePath) } : {}),
        stockQuantity: product.stockQuantity,
        isActive: product.isActive,
      })),
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
  private imageUrl(path: string | null): string | undefined {
    if (!path) return undefined
    return path.startsWith('http')
      ? path
      : `${this.imageBaseUrl}/images/${path.replace(/^\/+/, '')}`
  }
}
