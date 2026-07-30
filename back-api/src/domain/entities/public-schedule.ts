export type PublicScheduleType = 'movie' | 'stage' | 'event'

export type PublicSchedule = {
  scheduleId: number
  type: PublicScheduleType
  movieId: number | null
  movieTitle: string | null
  stageId: number | null
  stageTitle: string | null
  thumbnailFilename: string | null
  durationMin: number
  screenName: string
  startsAt: Date | string
  endsAt: Date | string
  remainingSeats: number
  totalSeats: number
}
