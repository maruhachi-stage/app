import type { Schedule } from "~/entities/screening/types"

export type Stage = {
  id: number
  title: string
  description: string
  durationMin: number
  thumbnailUrl: string | null
  status: "now_showing" | "coming_soon"
  playwright: string | null
  director: string | null
  schedules?: Schedule[]
}
