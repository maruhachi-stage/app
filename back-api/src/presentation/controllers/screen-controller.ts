import type { Context } from 'hono'
import type { ScreenQueryService } from '#application/services/screen-query-service.js'
import type { AppEnv } from '#types.js'
import { AppError } from '#lib/errors.js'
import { successResponse } from '#presentation/response.js'

export class ScreenController {
  constructor(private readonly screenQueryService: ScreenQueryService) {}

  list = async (c: Context<AppEnv>) => {
    const rows = await this.screenQueryService.list()
    return c.json(successResponse({ items: rows.map(toScreenResponse) }, c.get('requestId')))
  }

  get = async (c: Context<AppEnv>) => {
    const screenId = Number(c.req.param('screenId'))
    if (!Number.isInteger(screenId) || screenId <= 0) throw new AppError('VALIDATION_ERROR', 'Invalid screenId')
    const screen = await this.screenQueryService.getById(screenId)
    if (!screen) throw new AppError('NOT_FOUND', 'Screen not found')
    return c.json(successResponse(toScreenResponse(screen), c.get('requestId')))
  }
}

function toScreenResponse(screen: Awaited<ReturnType<ScreenQueryService['getById']>> & {}) {
  if (!screen) throw new Error('Screen is required')
  return {
    id: screen.id,
    name: screen.name,
    size: screen.size,
    totalSeats: screen.totalSeats,
    backgroundImageUrl: screen.backgroundImageUrl,
    aspectRatioWidth: screen.aspectRatioWidth,
    aspectRatioHeight: screen.aspectRatioHeight,
  }
}
