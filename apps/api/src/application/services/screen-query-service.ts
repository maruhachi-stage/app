import type { ScreenDTO } from '#application/dto/screen-dto.js'
import type { ScreenRepository } from '#domain/interfaces/repositories/screen-repository.js'

export class ScreenQueryService {
  constructor(private readonly screenRepository: ScreenRepository) {}

  list(): Promise<ScreenDTO[]> {
    return this.screenRepository.findAll()
  }

  getById(screenId: number): Promise<ScreenDTO | null> {
    return this.screenRepository.findById(screenId)
  }
}
