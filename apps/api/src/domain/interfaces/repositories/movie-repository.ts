import type { Movie } from '#domain/entities/movie.js'
import type { MovieSchedule } from '#domain/entities/movie-schedule.js'
import type { PublicSchedule } from '#domain/entities/public-schedule.js'

export interface MovieRepository {
  findMovies(filters: { status?: Movie['status']; date?: string }): Promise<Movie[]>
  findMovieById(movieId: number): Promise<Movie | null>
  findSchedulesByMovieId(movieId: number, date?: string): Promise<MovieSchedule[]>
  findPublicScheduleById(scheduleId: number): Promise<PublicSchedule | null>
}
