import { MysqlMovieRepository } from '#infrastructure/repositories/mysql-movie-repository.js'
import { MovieService } from '#application/services/movie-service.js'
import { MysqlStageRepository } from '#infrastructure/repositories/mysql-stage-repository.js'
import { MysqlScreenRepository } from '#infrastructure/repositories/mysql-screen-repository.js'
import { StageQueryService } from '#application/services/stage-query-service.js'
import { ScreenQueryService } from '#application/services/screen-query-service.js'
import { MysqlMemberRepository } from '#infrastructure/repositories/mysql-member-repository.js'
import { MysqlMemberReservationRepository } from '#infrastructure/repositories/mysql-member-reservation-repository.js'
import { MysqlOtpTokenRepository } from '#infrastructure/repositories/mysql-otp-token-repository.js'
import { ResendEmailSender } from '#infrastructure/adapters/resend-email-sender.js'
import { CryptoOtpCodeGenerator } from '#infrastructure/adapters/crypto-otp-code-generator.js'
import { InMemoryRateLimiter } from '#infrastructure/adapters/in-memory-rate-limiter.js'
import { AuthService } from '#application/services/auth-service.js'
import { MemberService } from '#application/services/member-service.js'
import { OTP_CONFIG } from '#lib/constants.js'
import { AuthController } from '#presentation/controllers/auth-controller.js'
import { MemberController } from '#presentation/controllers/member-controller.js'
import { MovieController } from '#presentation/controllers/movie-controller.js'
import { StageController } from '#presentation/controllers/stage-controller.js'
import { ScreenController } from '#presentation/controllers/screen-controller.js'
import { ConfigController } from '#presentation/controllers/config-controller.js'
import { ProductController } from '#presentation/controllers/product-controller.js'
import { PosController } from '#presentation/controllers/pos-controller.js'
import { AdminController } from '#presentation/controllers/admin-controller.js'
import { MysqlAdminScreenRepository } from '#infrastructure/repositories/mysql-admin-screen-repository.js'
import { AdminOverviewService } from '#application/services/admin-overview-service.js'
import { ConfigService } from '#application/services/config-service.js'
import { MysqlProductRepository } from '#infrastructure/repositories/mysql-product-repository.js'
import { MysqlPosRepository } from '#infrastructure/repositories/mysql-pos-repository.js'
import { ProductService } from '#application/services/product-service.js'
import { PosService } from '#application/services/pos-service.js'
import { MysqlReservationRepository } from '#infrastructure/repositories/mysql-reservation-repository.js'
import { ReservationService } from '#application/services/reservation-service.js'
import { ReservationController } from '#presentation/controllers/reservation-controller.js'
import { checkRateLimit } from '#lib/rateLimit.js'

/**
 * Composition root dependencies. Feature services are added here as they are
 * migrated, keeping framework and database construction out of application code.
 */
export const container = {
  movieController: new MovieController(new MovieService(new MysqlMovieRepository())),
  stageController: new StageController(new StageQueryService(new MysqlStageRepository())),
  screenController: new ScreenController(new ScreenQueryService(new MysqlScreenRepository())),
  authController: new AuthController(new AuthService(
    new MysqlMemberRepository(),
    new MysqlOtpTokenRepository(),
    new ResendEmailSender(),
    new CryptoOtpCodeGenerator(),
    new InMemoryRateLimiter(),
    { expiresMin: OTP_CONFIG.EXPIRES_MIN, resendSec: OTP_CONFIG.RESEND_SEC, maxAttempts: OTP_CONFIG.MAX_ATTEMPTS, lockMin: OTP_CONFIG.LOCK_MIN },
  )),
  memberController: new MemberController(new MemberService(
    new MysqlMemberRepository(),
    new MysqlMemberReservationRepository(),
  )),
  adminController: new AdminController(new AdminOverviewService(new MysqlAdminScreenRepository())),
  configController: new ConfigController(new ConfigService()),
  productController: new ProductController(new ProductService(new MysqlProductRepository())),
  posController: new PosController(new PosService(new MysqlPosRepository())),
  reservationController: new ReservationController(
    new ReservationService(new MysqlReservationRepository()),
    checkRateLimit,
  ),
}
