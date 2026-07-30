import type { Context } from 'hono'
import type { StageQueryService } from '#application/services/stage-query-service.js'
import type { AppEnv } from '#types.js'
import { AppError } from '#lib/errors.js'
import { imageUrl } from '#lib/format.js'
import { successResponse } from '#presentation/response.js'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export class StageController {
  constructor(private readonly stageQueryService: StageQueryService) {}

  list = async (c: Context<AppEnv>) => {
    const requestId = c.get('requestId')
    const date = c.req.query('date')
    const status = c.req.query('status')
    const type = c.req.query('type') as 'stage' | 'event' | undefined
    if (date && !DATE_RE.test(date)) throw new AppError('VALIDATION_ERROR', 'date must be YYYY-MM-DD')
    if (status && !['now_showing', 'coming_soon'].includes(status)) {
      throw new AppError('VALIDATION_ERROR', 'Invalid status value')
    }
    if (type && !['stage', 'event'].includes(type)) throw new AppError('VALIDATION_ERROR', 'Invalid type value')

    const stages = await this.stageQueryService.list({
      date,
      status: status as 'now_showing' | 'coming_soon' | undefined,
      type,
    })
    const items = await Promise.all(stages.map(async (stage) => ({
      id: stage.id,
      type: stage.type,
      title: stage.title,
      description: stage.description,
      durationMin: stage.durationMin,
      thumbnailUrl: imageUrl(stage.thumbnailUrl),
      status: stage.status,
      playwright: stage.playwright,
      director: stage.director,
      schedules: date ? (await this.stageQueryService.getSchedules(stage.id, date)).map(toScheduleResponse) : [],
    })))
    return c.json(successResponse({ items }, requestId))
  }

  get = async (c: Context<AppEnv>) => {
    const requestId = c.get('requestId')
    const stageId = parsePositiveInteger(c.req.param('stageId'), 'stageId')
    const stage = await this.stageQueryService.getById(stageId)
    if (!stage) throw new AppError('NOT_FOUND', 'Stage not found')
    return c.json(successResponse(toStageResponse(stage), requestId))
  }

  getSchedules = async (c: Context<AppEnv>) => {
    const requestId = c.get('requestId')
    const stageId = parsePositiveInteger(c.req.param('stageId'), 'stageId')
    const date = c.req.query('date')
    if (date && !DATE_RE.test(date)) throw new AppError('VALIDATION_ERROR', 'date must be YYYY-MM-DD')
    const result = await this.stageQueryService.getWithSchedules(stageId, date)
    if (!result) throw new AppError('NOT_FOUND', 'Stage not found')
    return c.json(successResponse({
      stage: toStageResponse(result.stage),
      schedules: result.schedules.map(toScheduleResponse),
    }, requestId))
  }
}

function parsePositiveInteger(value: string | undefined, fieldName: string): number {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new AppError('VALIDATION_ERROR', `Invalid ${fieldName}`)
  return id
}

function toStageResponse(stage: Awaited<ReturnType<StageQueryService['getById']>> & {}) {
  if (!stage) throw new Error('Stage is required')
  return {
    id: stage.id,
    type: stage.type,
    title: stage.title,
    description: stage.description,
    durationMin: stage.durationMin,
    thumbnailUrl: imageUrl(stage.thumbnailUrl),
    status: stage.status,
    playwright: stage.playwright,
    director: stage.director,
  }
}

function toScheduleResponse(schedule: Awaited<ReturnType<StageQueryService['getSchedules']>>[number]) {
  return {
    scheduleId: schedule.scheduleId,
    screenName: schedule.screenName,
    startsAt: schedule.startsAt,
    endsAt: schedule.endsAt,
    remainingSeats: schedule.remainingSeats,
    totalSeats: schedule.totalSeats,
  }
}
