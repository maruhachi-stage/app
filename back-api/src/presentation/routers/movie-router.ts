import { Hono } from 'hono'
import type { MovieService } from '#application/services/movie-service.js'
import type { AppEnv } from '#types.js'
import { MovieController } from '#presentation/controllers/movie-controller.js'

export function createMovieRouter(movieService: MovieService): Hono<AppEnv> {
  const router = new Hono<AppEnv>()
  const controller = new MovieController(movieService)
  router.get('/movies', controller.listMovies)
  router.get('/movies/:movieId', controller.getMovie)
  router.get('/movies/:movieId/schedules', controller.getMovieSchedules)
  router.get('/schedules/:scheduleId', controller.getSchedule)
  return router
}
