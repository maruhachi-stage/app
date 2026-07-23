import { Hono } from 'hono'
import type { PosService } from '#application/services/pos-service.js'
import type { AppEnv } from '#types.js'
import { PosController } from '#presentation/controllers/pos-controller.js'

export function createPosRouter(posService: PosService): Hono<AppEnv> {
  const router = new Hono<AppEnv>(); const controller = new PosController(posService)
  router.get('/pos/products', controller.listProducts); router.get('/pos/sales', controller.listSales); router.post('/pos/sales', controller.createSale)
  return router
}
