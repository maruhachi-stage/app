import { Hono } from 'hono'
import type { ConfigService } from '#application/services/config-service.js'
import type { AppEnv } from '#types.js'
import { ConfigController } from '#presentation/controllers/config-controller.js'

export function createConfigRouter(configService: ConfigService) {
  const controller = new ConfigController(configService)
  const router = new Hono<AppEnv>()
  router.get('/config', controller.getConfig)
  return router
}
