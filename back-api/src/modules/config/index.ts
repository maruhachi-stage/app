import { Hono } from 'hono'
import type { AppEnv } from '#types.js'
import { getConfig } from './handlers.js'

const router = new Hono<AppEnv>()

router.get('/config', getConfig)

export default router
