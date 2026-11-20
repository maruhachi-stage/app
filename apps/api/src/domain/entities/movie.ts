export type MovieStatus = 'now_showing' | 'coming_soon'

export type Movie = {
  id: number
  title: string
  description: string
  durationMin: number
  thumbnailFilename: string | null
  status: MovieStatus
}
