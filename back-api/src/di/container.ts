import { DrizzleMovieRepository } from '#infrastructure/repositories/drizzle-movie-repository.js'
import { MovieService } from '#application/services/movie-service.js'
import { DrizzleStageRepository } from '#infrastructure/repositories/drizzle-stage-repository.js'
import { DrizzleScreenRepository } from '#infrastructure/repositories/drizzle-screen-repository.js'
import { StageQueryService } from '#application/services/stage-query-service.js'
import { ScreenQueryService } from '#application/services/screen-query-service.js'
import { DrizzleMemberRepository } from '#infrastructure/repositories/drizzle-member-repository.js'
import { DrizzleMemberReservationRepository } from '#infrastructure/repositories/drizzle-member-reservation-repository.js'
import { DrizzleOtpTokenRepository } from '#infrastructure/repositories/drizzle-otp-token-repository.js'
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
import { StaffAuthController } from '#presentation/controllers/staff-auth-controller.js'
import { StaffOverviewController } from '#presentation/controllers/staff-overview-controller.js'
import { StaffAuthService } from '#application/services/staff-auth-service.js'
import { StaffOverviewService } from '#application/services/staff-overview-service.js'
import { DrizzleStaffAccountRepository } from '#infrastructure/repositories/drizzle-staff-account-repository.js'
import { DrizzleStaffOtpChallengeRepository } from '#infrastructure/repositories/drizzle-staff-otp-challenge-repository.js'
import { DrizzleStaffSessionRepository } from '#infrastructure/repositories/drizzle-staff-session-repository.js'
import { DrizzleStaffAuditLogRepository } from '#infrastructure/repositories/drizzle-staff-audit-log-repository.js'
import { DrizzleStaffScreenRepository } from '#infrastructure/repositories/drizzle-staff-screen-repository.js'
import { ScryptPasswordHasher } from '#infrastructure/adapters/scrypt-password-hasher.js'
import { SecureTokenGenerator } from '#infrastructure/adapters/secure-token-generator.js'
import { STAFF_SESSION_CONFIG } from '#lib/constants.js'
import { ConfigService } from '#application/services/config-service.js'
import { DrizzleProductRepository } from '#infrastructure/repositories/drizzle-product-repository.js'
import { DrizzlePosRepository } from '#infrastructure/repositories/drizzle-pos-repository.js'
import { ProductService } from '#application/services/product-service.js'
import { PosService } from '#application/services/pos-service.js'
import { DrizzleReservationRepository } from '#infrastructure/repositories/drizzle-reservation-repository.js'
import { ReservationService } from '#application/services/reservation-service.js'
import { ReservationController } from '#presentation/controllers/reservation-controller.js'
import { checkRateLimit } from '#lib/rateLimit.js'

/**
 * Composition root dependencies. Feature services are added here as they are
 * migrated, keeping framework and database construction out of application code.
 */

/** Shared by the controller and the session middleware. */
export const staffAuthService = new StaffAuthService(
  new DrizzleStaffAccountRepository(),
  new DrizzleStaffOtpChallengeRepository(),
  new DrizzleStaffSessionRepository(),
  new DrizzleStaffAuditLogRepository(),
  new ScryptPasswordHasher(),
  new SecureTokenGenerator(),
  new CryptoOtpCodeGenerator(),
  new ResendEmailSender(),
  new InMemoryRateLimiter(),
  STAFF_SESSION_CONFIG,
)

export const container = {
  staffAuthService,
  movieController: new MovieController(new MovieService(new DrizzleMovieRepository())),
  stageController: new StageController(new StageQueryService(new DrizzleStageRepository())),
  screenController: new ScreenController(new ScreenQueryService(new DrizzleScreenRepository())),
  authController: new AuthController(
    new AuthService(
      new DrizzleMemberRepository(),
      new DrizzleOtpTokenRepository(),
      new ResendEmailSender(),
      new CryptoOtpCodeGenerator(),
      new InMemoryRateLimiter(),
      {
        expiresMin: OTP_CONFIG.EXPIRES_MIN,
        resendSec: OTP_CONFIG.RESEND_SEC,
        maxAttempts: OTP_CONFIG.MAX_ATTEMPTS,
        lockMin: OTP_CONFIG.LOCK_MIN,
      },
    ),
  ),
  memberController: new MemberController(
    new MemberService(new DrizzleMemberRepository(), new DrizzleMemberReservationRepository()),
  ),
  staffAuthController: new StaffAuthController(staffAuthService),
  staffOverviewController: new StaffOverviewController(
    new StaffOverviewService(new DrizzleStaffScreenRepository()),
  ),
  configController: new ConfigController(new ConfigService()),
  productController: new ProductController(new ProductService(new DrizzleProductRepository())),
  posController: new PosController(new PosService(new DrizzlePosRepository())),
  reservationController: new ReservationController(
    new ReservationService(new DrizzleReservationRepository()),
    checkRateLimit,
  ),
}
