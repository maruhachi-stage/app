import { Hono } from 'hono'
import type { ScreenQueryService } from '#application/services/screen-query-service.js'
import type { AppEnv } from '#types.js'
import { ScreenController } from '#presentation/controllers/screen-controller.js'

export function createScreenRouter(screenQueryService: ScreenQueryService) {
  const controller = new ScreenController(screenQueryService)
  const router = new Hono<AppEnv>()
  router.get('/screens', controller.list)
  router.get('/screens/:screenId', controller.get)
  return router
}
