import { Hono } from 'hono'
import type { AppEnv } from '#types.js'
import { createSale, listProducts, listSales } from '#modules/pos/handlers.js'

const router = new Hono<AppEnv>()

router.get('/pos/products', listProducts)
router.get('/pos/sales', listSales)
router.post('/pos/sales', createSale)

export default router
