import type { Context } from 'hono'
import type { AppEnv } from '#types.js'
import { AppError } from '#lib/errors.js'
import { successResponse } from '#utils/response.js'
import { imageUrl } from '#utils/format.js'
import * as StageService from '#modules/stages/service.js'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export const listStages = async (c: Context<AppEnv>) => {
  const requestId = c.get('requestId')
  const date = c.req.query('date')
  const status = c.req.query('status')

  if (date && !DATE_RE.test(date)) throw new AppError('VALIDATION_ERROR', 'date must be YYYY-MM-DD')
  if (status && !['now_showing', 'coming_soon'].includes(status)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid status value')
  }

  const stageRows = await StageService.getStages(status, date)
  const items = await Promise.all(stageRows.map(async (r) => {
    const schedules = date ? await StageService.getSchedulesByStageId(r.id, date) : []
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      durationMin: r.duration_min,
      thumbnailUrl: imageUrl(r.thumbnail_url),
      status: r.status,
      playwright: r.playwright,
      director: r.director,
      schedules: schedules.map(s => ({
        scheduleId: s.schedule_id,
        screenName: s.screen_name,
        startsAt: s.starts_at,
        endsAt: s.ends_at,
        remainingSeats: Number(s.remaining_seats),
        totalSeats: Number(s.total_seats),
      })),
    }
  }))

  return c.json(successResponse({ items }, requestId))
}

export const getStage = async (c: Context<AppEnv>) => {
  const requestId = c.get('requestId')
  const stageId = Number(c.req.param('stageId'))

  if (!Number.isInteger(stageId) || stageId <= 0) throw new AppError('VALIDATION_ERROR', 'Invalid stageId')

  const stage = await StageService.getStageById(stageId)
  if (!stage) throw new AppError('NOT_FOUND', 'Stage not found')

  return c.json(successResponse({
    id: stage.id,
    title: stage.title,
    description: stage.description,
    durationMin: stage.duration_min,
    thumbnailUrl: imageUrl(stage.thumbnail_url),
    status: stage.status,
    playwright: stage.playwright,
    director: stage.director,
  }, requestId))
}

export const getStageSchedules = async (c: Context<AppEnv>) => {
  const requestId = c.get('requestId')
  const stageId = Number(c.req.param('stageId'))
  const date = c.req.query('date')

  if (!Number.isInteger(stageId) || stageId <= 0) throw new AppError('VALIDATION_ERROR', 'Invalid stageId')
  if (date && !DATE_RE.test(date)) throw new AppError('VALIDATION_ERROR', 'date must be YYYY-MM-DD')

  const stage = await StageService.getStageById(stageId)
  if (!stage) throw new AppError('NOT_FOUND', 'Stage not found')

  const rows = await StageService.getSchedulesByStageId(stageId, date)

  return c.json(successResponse({
    stage: {
      id: stage.id,
      title: stage.title,
      description: stage.description,
      durationMin: stage.duration_min,
      thumbnailUrl: imageUrl(stage.thumbnail_url),
      status: stage.status,
      playwright: stage.playwright,
      director: stage.director,
    },
    schedules: rows.map(r => ({
      scheduleId: r.schedule_id,
      screenName: r.screen_name,
      startsAt: r.starts_at,
      endsAt: r.ends_at,
      remainingSeats: Number(r.remaining_seats),
      totalSeats: Number(r.total_seats),
    })),
  }, requestId))
}
