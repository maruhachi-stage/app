import { mysqlPool } from '#infrastructure/database/mysqlPool.js'
import { MysqlMovieRepository } from '#infrastructure/repositories/mysql-movie-repository.js'
import { MovieService } from '#application/services/movie-service.js'

/**
 * Composition root dependencies. Feature services are added here as they are
 * migrated, keeping framework and database construction out of application code.
 */
export const container = {
  mysqlPool,
  movieService: new MovieService(new MysqlMovieRepository()),
}
