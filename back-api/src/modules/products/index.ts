import { Hono } from 'hono'
import type { AppEnv } from '#types.js'
import { getProduct, listProducts } from '#modules/products/handlers.js'

const router = new Hono<AppEnv>()

router.get('/products', listProducts)
router.get('/products/:productId', getProduct)

export default router
