export type Movie = {
  id: number
  title: string
  description: string
  durationMin: number
  thumbnailUrl: string | null
  status: "now_showing" | "coming_soon"
  schedules?: Schedule[]
}

export type Schedule = {
  scheduleId: number
  screenName: string
  startsAt: string
  endsAt: string
  remainingSeats: number
  totalSeats: number
}
