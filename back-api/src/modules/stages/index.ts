import { Hono } from 'hono'
import type { AppEnv } from '#types.js'
import { listStages, getStage, getStageSchedules } from '#modules/stages/handlers.js'

const router = new Hono<AppEnv>()

router.get('/stages', listStages)
router.get('/stages/:stageId', getStage)
router.get('/stages/:stageId/schedules', getStageSchedules)

export default router
