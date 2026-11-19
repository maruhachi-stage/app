import type { Context } from 'hono'
import { AppError } from '#domain/errors/appError.js'
import type { ProductCategory } from '#domain/entities/product.js'
import type { ProductService } from '#application/services/product-service.js'
import type { AppEnv } from '#types.js'
import { successResponse } from '#presentation/response.js'

const categories = ['goods', 'food', 'drink', 'set'] as const

export class ProductController {
  constructor(private readonly productService: ProductService) {}
  listProducts = async (context: Context<AppEnv>) => {
    const category = context.req.query('category')
    if (category && !categories.includes(category as ProductCategory))
      throw new AppError('VALIDATION_ERROR', 'Invalid product category')
    return context.json(
      successResponse(
        await this.productService.listProducts({
          category: category as ProductCategory | undefined,
        }),
        context.get('requestId'),
      ),
    )
  }
  getProduct = async (context: Context<AppEnv>) => {
    const productId = context.req.param('productId')
    if (!productId) throw new AppError('VALIDATION_ERROR', 'Product id is required')
    const product = await this.productService.getProduct(productId)
    if (!product) throw new AppError('NOT_FOUND', 'Product not found')
    return context.json(successResponse(product, context.get('requestId')))
  }
}
