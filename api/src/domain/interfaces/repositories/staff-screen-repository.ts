import type { StaffScreen } from '#domain/entities/staff-screen.js'

export interface StaffScreenRepository {
  findAll(): Promise<StaffScreen[]>
}
