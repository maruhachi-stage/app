import { Hono } from 'hono'
import type { AdminOverviewService } from '#application/services/admin-overview-service.js'
import type { AppEnv } from '#types.js'
import { AdminController } from '#presentation/controllers/admin-controller.js'
import { requireAdminEditKey } from '#presentation/middleware/admin-edit-key.js'

export function createAdminRouter(adminOverviewService: AdminOverviewService) {
  const controller = new AdminController(adminOverviewService)
  const router = new Hono<AppEnv>()

  router.get('/admin/overview', controller.getOverview)
  router.post('/admin/edit-key/verify', controller.verifyEditKey)
  router.get('/admin/edit-access', requireAdminEditKey, controller.getEditAccess)

  return router
}
