import type { MemberReservation } from '#domain/entities/member-reservation.js'

export interface MemberReservationRepository {
  findByMemberId(memberId: number): Promise<MemberReservation[]>
}
