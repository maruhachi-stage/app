export type MemberReservation = {
  reservationCode: string
  status: string
  totalPrice: number
  createdAt: Date | string
  movieTitle: string
  thumbnailUrl: string | null
  startsAt: Date | string
  endsAt: Date | string
  screenName: string
}
