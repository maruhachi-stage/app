import type { ListStagesQueryDTO, StageDTO, StageScheduleDTO, StageWithSchedulesDTO } from '#application/dto/stage-dto.js'
import type { StageRepository } from '#domain/interfaces/repositories/stage-repository.js'

export class StageQueryService {
  constructor(private readonly stageRepository: StageRepository) {}

  list(query: ListStagesQueryDTO): Promise<StageDTO[]> {
    return this.stageRepository.findAll(query)
  }

  getById(stageId: number): Promise<StageDTO | null> {
    return this.stageRepository.findById(stageId)
  }

  getSchedules(stageId: number, date?: string): Promise<StageScheduleDTO[]> {
    return this.stageRepository.findSchedulesByStageId(stageId, date)
  }

  async getWithSchedules(stageId: number, date?: string): Promise<StageWithSchedulesDTO | null> {
    const stage = await this.getById(stageId)
    if (!stage) return null

    return { stage, schedules: await this.getSchedules(stageId, date) }
  }
}
