import type { Context } from 'hono'
import type { MovieStatus } from '#domain/entities/movie.js'
import { AppError } from '#lib/errors.js'
import type { AppEnv } from '#types.js'
import { successResponse } from '#presentation/response.js'
import type { MovieService } from '#application/services/movie-service.js'

const datePattern = /^\d{4}-\d{2}-\d{2}$/

export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  listMovies = async (context: Context<AppEnv>) => {
    const date = context.req.query('date')
    const status = context.req.query('status')
    if (date && !datePattern.test(date)) throw new AppError('VALIDATION_ERROR', 'date must be YYYY-MM-DD')
    if (status && !['now_showing', 'coming_soon'].includes(status)) throw new AppError('VALIDATION_ERROR', 'Invalid status value')
    const data = await this.movieService.listMovies({ date, status: status as MovieStatus | undefined })
    return context.json(successResponse(data, context.get('requestId')))
  }

  getMovie = async (context: Context<AppEnv>) => {
    const movieId = this.parsePositiveId(context.req.param('movieId'), 'movieId')
    const movie = await this.movieService.getMovie(movieId)
    if (!movie) throw new AppError('NOT_FOUND', 'Movie not found')
    return context.json(successResponse(movie, context.get('requestId')))
  }

  getMovieSchedules = async (context: Context<AppEnv>) => {
    const movieId = this.parsePositiveId(context.req.param('movieId'), 'movieId')
    const date = context.req.query('date')
    if (date && !datePattern.test(date)) throw new AppError('VALIDATION_ERROR', 'date must be YYYY-MM-DD')
    const data = await this.movieService.getMovieSchedules(movieId, date)
    if (!data) throw new AppError('NOT_FOUND', 'Movie not found')
    return context.json(successResponse(data, context.get('requestId')))
  }

  getSchedule = async (context: Context<AppEnv>) => {
    const scheduleId = this.parsePositiveId(context.req.param('scheduleId'), 'scheduleId')
    const schedule = await this.movieService.getSchedule(scheduleId)
    if (!schedule) throw new AppError('NOT_FOUND', 'Schedule not found')
    return context.json(successResponse(schedule, context.get('requestId')))
  }

  private parsePositiveId(value: string | undefined, name: string): number {
    const id = Number(value)
    if (!Number.isInteger(id) || id <= 0) throw new AppError('VALIDATION_ERROR', `Invalid ${name}`)
    return id
  }
}
