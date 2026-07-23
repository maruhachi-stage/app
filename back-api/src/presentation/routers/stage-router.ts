import { Hono } from 'hono'
import type { StageQueryService } from '#application/services/stage-query-service.js'
import type { AppEnv } from '#types.js'
import { StageController } from '#presentation/controllers/stage-controller.js'

export function createStageRouter(stageQueryService: StageQueryService) {
  const controller = new StageController(stageQueryService)
  const router = new Hono<AppEnv>()
  router.get('/stages', controller.list)
  router.get('/stages/:stageId', controller.get)
  router.get('/stages/:stageId/schedules', controller.getSchedules)
  return router
}
