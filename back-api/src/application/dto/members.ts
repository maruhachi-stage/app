import { z } from 'zod'

export const createMemberRequestSchema = z.object({
  email: z.string().email().max(254),
  name: z.string().max(100).optional(),
})

export type CreateMemberRequestDTO = z.infer<typeof createMemberRequestSchema>
export type MemberDTO = { id: number; email: string; name: string | null }
export type ReservationListItemDTO = {
  reservationCode: string; status: string; totalPrice: number; createdAt: Date | string
  movieTitle: string; thumbnailUrl: string | null; startsAt: Date | string; endsAt: Date | string; screenName: string
}
export type ReservationListResponseDTO = { items: ReservationListItemDTO[] }
