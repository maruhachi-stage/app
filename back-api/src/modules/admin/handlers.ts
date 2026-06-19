import type { Context } from 'hono'
import type { AppEnv } from '#types.js'
import { hasValidAdminEditKey, isAdminEditKeyConfigured } from '#middleware/adminEditKey.js'
import { successResponse } from '#utils/response.js'
import * as AdminService from '#modules/admin/service.js'

export const getOverview = async (c: Context<AppEnv>) => {
  const requestId = c.get('requestId')
  const screens = await AdminService.getAdminScreens()

  return c.json(successResponse({
    editKey: {
      configured: isAdminEditKeyConfigured(),
      valid: hasValidAdminEditKey(c),
    },
    screens: {
      total: screens.length,
      seats: screens.reduce((sum, screen) => sum + Number(screen.total_seats), 0),
      items: screens.map(screen => ({
        id: screen.id,
        name: screen.name,
        size: screen.size,
        totalSeats: Number(screen.total_seats),
        seatCount: Number(screen.seat_count),
        layoutId: screen.layout_id,
        layoutVersion: screen.layout_version,
        aspectRatio: screen.aspect_ratio_width && screen.aspect_ratio_height
          ? `${screen.aspect_ratio_width}/${screen.aspect_ratio_height}`
          : null,
      })),
    },
  }, requestId))
}

export const verifyEditKey = async (c: Context<AppEnv>) => {
  const requestId = c.get('requestId')

  return c.json(successResponse({
    configured: isAdminEditKeyConfigured(),
    valid: hasValidAdminEditKey(c),
  }, requestId))
}

export const getEditAccess = async (c: Context<AppEnv>) => {
  const requestId = c.get('requestId')

  return c.json(successResponse({
    available: true,
  }, requestId))
}
