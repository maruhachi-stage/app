export type ScreeningType = "movie" | "stage" | "event"

export type Movie = {
  id: number
  title: string
  description: string
  durationMin: number
  thumbnailUrl: string | null
  status: "now_showing" | "coming_soon"
  schedules?: Schedule[]
  playwright?: string | null
  director?: string | null
  type?: ScreeningType
}

export type Schedule = {
  scheduleId: number
  screenName: string
  startsAt: string
  endsAt: string
  remainingSeats: number
  totalSeats: number
}
