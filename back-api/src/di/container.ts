import { mysqlPool } from '#infrastructure/database/mysqlPool.js'
import { MysqlMovieRepository } from '#infrastructure/repositories/mysql-movie-repository.js'
import { MovieService } from '#application/services/movie-service.js'
import { MysqlStageRepository } from '#infrastructure/repositories/mysql-stage-repository.js'
import { MysqlScreenRepository } from '#infrastructure/repositories/mysql-screen-repository.js'
import { StageQueryService } from '#application/services/stage-query-service.js'
import { ScreenQueryService } from '#application/services/screen-query-service.js'

/**
 * Composition root dependencies. Feature services are added here as they are
 * migrated, keeping framework and database construction out of application code.
 */
export const container = {
  mysqlPool,
  movieService: new MovieService(new MysqlMovieRepository()),
  stageQueryService: new StageQueryService(new MysqlStageRepository()),
  screenQueryService: new ScreenQueryService(new MysqlScreenRepository()),
}
