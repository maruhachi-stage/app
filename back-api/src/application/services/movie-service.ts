import type {
  ListMoviesQueryDTO,
  MovieDTO,
  MovieListResponseDTO,
  MovieScheduleDTO,
  MovieSchedulesResponseDTO,
  PublicScheduleDTO,
} from '#application/dto/movies/movie-dto.js'
import type { Movie } from '#domain/entities/movie.js'
import type { MovieSchedule } from '#domain/entities/movie-schedule.js'
import type { PublicSchedule } from '#domain/entities/public-schedule.js'
import type { MovieRepository } from '#domain/interfaces/repositories/movie-repository.js'

export class MovieService {
  constructor(
    private readonly movieRepository: MovieRepository,
    private readonly imageBaseUrl = process.env.IMAGE_BASE_URL ?? 'http://localhost:3001',
  ) {}

  async listMovies(query: ListMoviesQueryDTO): Promise<MovieListResponseDTO> {
    const movies = await this.movieRepository.findMovies(query)
    const items = await Promise.all(
      movies.map(async (movie) => ({
        ...this.toMovieDTO(movie),
        schedules: query.date
          ? (await this.movieRepository.findSchedulesByMovieId(movie.id, query.date)).map(
              (schedule) => this.toScheduleDTO(schedule),
            )
          : [],
      })),
    )
    return { items }
  }

  async getMovie(movieId: number): Promise<MovieDTO | null> {
    const movie = await this.movieRepository.findMovieById(movieId)
    return movie ? this.toMovieDTO(movie) : null
  }

  async getMovieSchedules(
    movieId: number,
    date?: string,
  ): Promise<MovieSchedulesResponseDTO | null> {
    const movie = await this.movieRepository.findMovieById(movieId)
    if (!movie) return null
    const schedules = await this.movieRepository.findSchedulesByMovieId(movieId, date)
    return {
      movie: this.toMovieDTO(movie),
      schedules: schedules.map((schedule) => this.toScheduleDTO(schedule)),
    }
  }

  async getSchedule(scheduleId: number): Promise<PublicScheduleDTO | null> {
    const schedule = await this.movieRepository.findPublicScheduleById(scheduleId)
    return schedule ? this.toPublicScheduleDTO(schedule) : null
  }

  private toMovieDTO(movie: Movie): MovieDTO {
    return {
      id: movie.id,
      title: movie.title,
      description: movie.description,
      durationMin: movie.durationMin,
      thumbnailUrl: this.imageUrl(movie.thumbnailFilename),
      status: movie.status,
    }
  }

  private toScheduleDTO(schedule: MovieSchedule): MovieScheduleDTO {
    return { ...schedule }
  }

  private toPublicScheduleDTO(schedule: PublicSchedule): PublicScheduleDTO {
    return {
      scheduleId: schedule.scheduleId,
      movieId: schedule.movieId,
      movieTitle: schedule.movieTitle,
      stageId: schedule.stageId,
      stageTitle: schedule.stageTitle,
      title: schedule.movieTitle ?? schedule.stageTitle,
      type: schedule.type,
      thumbnailUrl: this.imageUrl(schedule.thumbnailFilename),
      durationMin: schedule.durationMin,
      screenName: schedule.screenName,
      startsAt: schedule.startsAt,
      endsAt: schedule.endsAt,
      remainingSeats: schedule.remainingSeats,
      totalSeats: schedule.totalSeats,
    }
  }

  private imageUrl(filename: string | null): string | null {
    if (!filename) return null
    if (filename.startsWith('http')) return filename
    return `${this.imageBaseUrl}/images/${filename}`
  }
}
