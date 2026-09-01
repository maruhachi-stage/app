import type {
  CreateMemberRequestDTO,
  MemberDTO,
  ReservationListResponseDTO,
} from '#application/dto/members.js'
import { DomainError } from '#domain/errors/domain-error.js'
import type { MemberRepository } from '#domain/interfaces/repositories/member-repository.js'
import type { MemberReservationRepository } from '#domain/interfaces/repositories/member-reservation-repository.js'

export class MemberService {
  constructor(
    private readonly members: MemberRepository,
    private readonly reservations: MemberReservationRepository,
  ) {}

  async create(input: CreateMemberRequestDTO): Promise<{ member: MemberDTO; created: boolean }> {
    const name = input.name?.trim() || null
    const existing = await this.members.findByEmail(input.email)
    if (existing)
      return { member: { id: existing.id, email: existing.email, name }, created: false }
    const member = await this.members.create(input.email, name)
    return { member, created: true }
  }

  async getProfile(memberId: number): Promise<MemberDTO> {
    const member = await this.members.findById(memberId)
    if (!member) throw new DomainError('NOT_FOUND', 'Member not found')
    return member
  }

  async getReservations(memberId: number): Promise<ReservationListResponseDTO> {
    return { items: await this.reservations.findByMemberId(memberId) }
  }
}
