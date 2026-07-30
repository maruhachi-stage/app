import type { Stage } from '#domain/entities/stage.js'
import type { StageSchedule } from '#domain/entities/stage-schedule.js'

export type ListStagesQueryDTO = {
  status?: 'now_showing' | 'coming_soon'
  date?: string
  type?: 'stage' | 'event'
}

export type StageDTO = Stage
export type StageScheduleDTO = StageSchedule

export type StageWithSchedulesDTO = {
  stage: StageDTO
  schedules: StageScheduleDTO[]
}
