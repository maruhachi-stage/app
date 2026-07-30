import type { MovieStatus } from '#domain/entities/movie.js'

export type ListMoviesQueryDTO = {
  status?: MovieStatus
  date?: string
}

export type MovieDTO = {
  id: number
  title: string
  description: string
  durationMin: number
  thumbnailUrl: string | null
  status: MovieStatus
}

export type MovieScheduleDTO = {
  scheduleId: number
  screenName: string
  startsAt: Date | string
  endsAt: Date | string
  remainingSeats: number
  totalSeats: number
}

export type MovieListItemDTO = MovieDTO & {
  schedules: MovieScheduleDTO[]
}

export type MovieListResponseDTO = {
  items: MovieListItemDTO[]
}

export type MovieSchedulesResponseDTO = {
  movie: MovieDTO
  schedules: MovieScheduleDTO[]
}

export type PublicScheduleDTO = {
  scheduleId: number
  movieId: number | null
  movieTitle: string | null
  stageId: number | null
  stageTitle: string | null
  title: string | null
  type: 'movie' | 'stage' | 'event'
  thumbnailUrl: string | null
  durationMin: number
  screenName: string
  startsAt: Date | string
  endsAt: Date | string
  remainingSeats: number
  totalSeats: number
}
