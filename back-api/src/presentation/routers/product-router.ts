import { Hono } from 'hono'
import type { ProductService } from '#application/services/product-service.js'
import type { AppEnv } from '#types.js'
import { ProductController } from '#presentation/controllers/product-controller.js'

export function createProductRouter(productService: ProductService): Hono<AppEnv> {
  const router = new Hono<AppEnv>(); const controller = new ProductController(productService)
  router.get('/products', controller.listProducts); router.get('/products/:productId', controller.getProduct)
  return router
}
