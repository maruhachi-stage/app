import type { Context } from 'hono'
import type { AppEnv } from '#types.js'
import { AppError } from '#lib/errors.js'
import { successResponse } from '#utils/response.js'
import * as ScreenService from '#modules/screens/service.js'

export const listScreens = async (c: Context<AppEnv>) => {
  const requestId = c.get('requestId')
  const rows = await ScreenService.getScreens()
  
  const items = rows.map(r => ({
    id: r.id,
    name: r.name,
    size: r.size,
    totalSeats: r.total_seats,
    backgroundImageUrl: r.background_image_url,
    aspectRatioWidth: r.aspect_ratio_width,
    aspectRatioHeight: r.aspect_ratio_height,
  }))

  return c.json(successResponse({ items }, requestId))
}

export const getScreen = async (c: Context<AppEnv>) => {
  const requestId = c.get('requestId')
  const screenId = Number(c.req.param('screenId'))

  if (!Number.isInteger(screenId) || screenId <= 0) {
    throw new AppError('VALIDATION_ERROR', 'Invalid screenId')
  }

  const r = await ScreenService.getScreenById(screenId)
  if (!r) {
    throw new AppError('NOT_FOUND', 'Screen not found')
  }

  return c.json(successResponse({
    id: r.id,
    name: r.name,
    size: r.size,
    totalSeats: r.total_seats,
    backgroundImageUrl: r.background_image_url,
    aspectRatioWidth: r.aspect_ratio_width,
    aspectRatioHeight: r.aspect_ratio_height,
  }, requestId))
}
