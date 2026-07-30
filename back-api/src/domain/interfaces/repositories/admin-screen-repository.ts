import type { AdminScreen } from '#domain/entities/admin-screen.js'

export interface AdminScreenRepository {
  findAll(): Promise<AdminScreen[]>
}
