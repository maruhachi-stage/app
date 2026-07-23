import type { Context } from 'hono'
import type { AdminOverviewService } from '#application/services/admin-overview-service.js'
import type { AppEnv } from '#types.js'
import { successResponse } from '#presentation/response.js'
import { hasValidAdminEditKey, isAdminEditKeyConfigured } from '#presentation/middleware/admin-edit-key.js'

export class AdminController {
  constructor(private readonly adminOverviewService: AdminOverviewService) {}

  getOverview = async (c: Context<AppEnv>) => {
    const overview = await this.adminOverviewService.getOverview()
    return c.json(successResponse({
      editKey: {
        configured: isAdminEditKeyConfigured(),
        valid: hasValidAdminEditKey(c),
      },
      screens: overview.screens,
    }, c.get('requestId')))
  }

  verifyEditKey = async (c: Context<AppEnv>) => c.json(successResponse({
    configured: isAdminEditKeyConfigured(),
    valid: hasValidAdminEditKey(c),
  }, c.get('requestId')))

  getEditAccess = async (c: Context<AppEnv>) => c.json(successResponse({ available: true }, c.get('requestId')))
}
