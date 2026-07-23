import type { Stage } from '#domain/entities/stage.js'
import type { StageSchedule } from '#domain/entities/stage-schedule.js'

export type FindStagesCriteria = {
  status?: 'now_showing' | 'coming_soon'
  date?: string
  type?: 'stage' | 'event'
}

export interface StageRepository {
  findById(stageId: number): Promise<Stage | null>
  findSchedulesByStageId(stageId: number, date?: string): Promise<StageSchedule[]>
  findAll(criteria: FindStagesCriteria): Promise<Stage[]>
}
