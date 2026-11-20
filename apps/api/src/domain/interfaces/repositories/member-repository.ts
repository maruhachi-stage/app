import type { Member } from '#domain/entities/member.js'

export interface MemberRepository {
  findByEmail(email: string): Promise<Member | null>
  findById(id: number): Promise<Member | null>
  create(email: string, name: string | null): Promise<Member>
  getOrCreateByEmail(email: string): Promise<number>
}
