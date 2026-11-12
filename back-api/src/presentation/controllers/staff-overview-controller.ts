import type { Context } from 'hono'
import type { StaffOverviewService } from '#application/services/staff-overview-service.js'
import type { AppEnv } from '#types.js'
import { successResponse } from '#presentation/response.js'

export class StaffOverviewController {
  constructor(private readonly staffOverviewService: StaffOverviewService) {}

  getOverview = async (c: Context<AppEnv>) =>
    c.json(successResponse(await this.staffOverviewService.getOverview(), c.get('requestId')), 200)
}
