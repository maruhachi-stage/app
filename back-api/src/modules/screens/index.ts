import { Hono } from 'hono'
import type { AppEnv } from '#types.js'
import { listScreens, getScreen } from './handlers.js'

const router = new Hono<AppEnv>()

router.get('/screens', listScreens)
router.get('/screens/:screenId', getScreen)

export default router
