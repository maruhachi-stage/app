export type Stage = {
  id: number
  type: 'stage' | 'event'
  title: string
  description: string
  durationMin: number
  thumbnailUrl: string | null
  status: 'now_showing' | 'coming_soon'
  playwright: string | null
  director: string | null
}
