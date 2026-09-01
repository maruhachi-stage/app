import type { Context } from 'hono'
import type { ConfigService } from '#application/services/config-service.js'
import type { AppEnv } from '#types.js'
import { successResponse } from '#presentation/response.js'

export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  getConfig = (c: Context<AppEnv>) =>
    c.json(successResponse(this.configService.getConfig(), c.get('requestId')))
}
