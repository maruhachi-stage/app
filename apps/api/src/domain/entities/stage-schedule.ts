export type StageSchedule = {
  scheduleId: number
  screenName: string
  startsAt: Date | string
  endsAt: Date | string
  remainingSeats: number
  totalSeats: number
}
