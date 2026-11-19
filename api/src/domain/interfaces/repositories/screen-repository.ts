import type { Screen } from '#domain/entities/screen.js'

export interface ScreenRepository {
  findAll(): Promise<Screen[]>
  findById(screenId: number): Promise<Screen | null>
}
