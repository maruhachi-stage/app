import type {
  StaffAccountDTO,
  StaffChangePasswordRequestDTO,
  StaffCreateAccountRequestDTO,
  StaffLoginRequestDTO,
  StaffLoginResponseDTO,
  StaffMeResponseDTO,
  StaffProfileDTO,
  StaffUpdateAccountRequestDTO,
  StaffVerifyOtpRequestDTO,
  StaffVerifyOtpResponseDTO,
} from '#application/dto/staff-auth.js'
import type { EmailSender } from '#application/ports/email-sender.js'
import type { OtpCodeGenerator } from '#application/ports/otp-code-generator.js'
import type { PasswordHasher } from '#application/ports/password-hasher.js'
import type { RateLimiter } from '#application/ports/rate-limiter.js'
import type { TokenGenerator } from '#application/ports/token-generator.js'
import { getStaffRole, type StaffAccount } from '#domain/entities/staff-account.js'
import { AppError } from '#domain/errors/appError.js'
import type { StaffAccountRepository } from '#domain/interfaces/repositories/staff-account-repository.js'
import type { StaffAuditLogRepository } from '#domain/interfaces/repositories/staff-audit-log-repository.js'
import type { StaffOtpChallengeRepository } from '#domain/interfaces/repositories/staff-otp-challenge-repository.js'
import type { StaffSessionRepository } from '#domain/interfaces/repositories/staff-session-repository.js'

export type StaffAuthConfig = {
  otpExpiresMin: number
  maxOtpAttempts: number
  maxLoginFailures: number
  lockMin: number
  sessionMaxAgeSec: number
}

export type StaffAuthRequestMeta = {
  requestId: string
  ipAddress: string | null
  userAgent: string | null
  actorStaffId: number | null
}

type AuthenticatedStaff = {
  staffId: number
  roleId: number
  userId: string
  sessionToken: string
}

/**
 * Use cases for staff authentication and account administration. Cookies are
 * handled by the Presentation layer; this service only deals in opaque tokens.
 */
export class StaffAuthService {
  private unknownPasswordHash: Promise<string> | null = null

  constructor(
    private readonly accounts: StaffAccountRepository,
    private readonly challenges: StaffOtpChallengeRepository,
    private readonly sessions: StaffSessionRepository,
    private readonly auditLogs: StaffAuditLogRepository,
    private readonly passwords: PasswordHasher,
    private readonly tokens: TokenGenerator,
    private readonly otp: OtpCodeGenerator,
    private readonly email: EmailSender,
    private readonly rateLimiter: RateLimiter,
    private readonly config: StaffAuthConfig,
  ) {}

  async login(
    input: StaffLoginRequestDTO,
    meta: StaffAuthRequestMeta,
  ): Promise<StaffLoginResponseDTO & { challengeToken: string }> {
    this.assertRateLimit(`staff:login:ip:${meta.ipAddress ?? 'unknown'}`, 20)
    this.assertRateLimit(`staff:login:user:${input.userId}`, 10)

    const account = await this.accounts.findByUserId(input.userId)
    // Verify against a throwaway hash when the user ID is unknown so that
    // response time does not reveal which user IDs exist.
    const passwordValid = await this.passwords.verify(
      account ? account.passwordHash : await this.unknownHash(),
      input.password,
    )

    const now = new Date()
    if (!account || account.status !== 'active' || this.isLocked(account, now) || !passwordValid) {
      if (account) await this.recordLoginFailure(account, now)
      throw new AppError('UNAUTHORIZED', 'Invalid user ID or password')
    }

    await this.accounts.recordLoginSuccess(account.id, now)
    const challengeToken = await this.issueOtp(account)
    return {
      otpRequired: true,
      expiresInSec: this.config.otpExpiresMin * 60,
      challengeToken,
    }
  }

  async resendOtp(
    challengeToken: string | null,
    meta: StaffAuthRequestMeta,
  ): Promise<{ expiresInSec: number; challengeToken: string }> {
    const challenge = await this.requireChallenge(challengeToken)
    const account = await this.accounts.findById(challenge.staffAccountId)
    if (!account || account.status !== 'active') {
      throw new AppError('UNAUTHORIZED', 'OTP challenge expired')
    }
    this.assertRateLimit(`staff:otp:resend:${account.id}`, 5)
    await this.challenges.invalidateActive(account.id, new Date())
    const nextChallengeToken = await this.issueOtp(account)
    await this.audit(account.id, 'staff.auth.otp_resent', meta)
    return { expiresInSec: this.config.otpExpiresMin * 60, challengeToken: nextChallengeToken }
  }

  async verifyOtp(
    challengeToken: string | null,
    input: StaffVerifyOtpRequestDTO,
    meta: StaffAuthRequestMeta,
  ): Promise<StaffVerifyOtpResponseDTO & { sessionToken: string; sessionMaxAgeSec: number }> {
    const challenge = await this.requireChallenge(challengeToken)
    if (challenge.failedAttempts >= this.config.maxOtpAttempts) {
      throw new AppError('OTP_ATTEMPTS_EXCEEDED', 'Too many OTP attempts')
    }

    if (this.otp.hash(input.code) !== challenge.otpHash) {
      const attempts = challenge.failedAttempts + 1
      await this.challenges.recordFailure(challenge.id, attempts)
      if (attempts >= this.config.maxOtpAttempts) {
        throw new AppError('OTP_ATTEMPTS_EXCEEDED', 'Too many OTP attempts')
      }
      throw new AppError('OTP_INVALID', 'Invalid OTP')
    }

    const account = await this.accounts.findById(challenge.staffAccountId)
    if (!account || account.status !== 'active') {
      throw new AppError('UNAUTHORIZED', 'Staff account is unavailable')
    }

    const now = new Date()
    await this.challenges.markUsed(challenge.id, now)
    const sessionToken = this.tokens.create()
    await this.sessions.create({
      tokenHash: this.tokens.hash(sessionToken),
      staffAccountId: account.id,
      expiresAt: new Date(now.getTime() + this.config.sessionMaxAgeSec * 1000),
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent?.slice(0, 500) ?? null,
    })
    await this.accounts.recordLoginSuccess(account.id, now)
    await this.audit(account.id, 'staff.auth.login', meta)

    return {
      authenticated: true,
      staff: toProfile(account),
      sessionToken,
      sessionMaxAgeSec: this.config.sessionMaxAgeSec,
    }
  }

  async getMe(sessionToken: string | null): Promise<StaffMeResponseDTO> {
    const authenticated = await this.resolveSession(sessionToken)
    if (!authenticated) return { authenticated: false }
    const account = await this.accounts.findById(authenticated.staffId)
    if (!account || account.status !== 'active') return { authenticated: false }
    return { authenticated: true, staff: toProfile(account) }
  }

  async logout(sessionToken: string | null, meta: StaffAuthRequestMeta): Promise<void> {
    if (sessionToken) {
      await this.sessions.revokeByTokenHash(this.tokens.hash(sessionToken), new Date())
    }
    if (meta.actorStaffId !== null) await this.audit(meta.actorStaffId, 'staff.auth.logout', meta)
  }

  async changePassword(
    staffId: number,
    input: StaffChangePasswordRequestDTO,
    meta: StaffAuthRequestMeta,
  ): Promise<void> {
    const account = await this.accounts.findById(staffId)
    if (!account) throw new AppError('UNAUTHORIZED', 'Staff authentication required')
    if (!(await this.passwords.verify(account.passwordHash, input.currentPassword))) {
      throw new AppError('UNAUTHORIZED', 'Current password is invalid')
    }
    await this.accounts.updatePasswordHash(staffId, await this.passwords.hash(input.newPassword))
    await this.audit(staffId, 'staff.auth.password_changed', meta)
  }

  async resolveSession(sessionToken: string | null): Promise<AuthenticatedStaff | null> {
    if (!sessionToken) return null
    const context = await this.sessions.findActiveByTokenHash(
      this.tokens.hash(sessionToken),
      new Date(),
    )
    if (!context) return null
    return {
      staffId: context.staffId,
      roleId: context.roleId,
      userId: context.userId,
      sessionToken,
    }
  }

  async listAccounts(): Promise<StaffAccountDTO[]> {
    return (await this.accounts.findAll()).map(toAccountDTO)
  }

  async createAccount(
    input: StaffCreateAccountRequestDTO,
    meta: StaffAuthRequestMeta,
  ): Promise<{ id: number }> {
    this.assertKnownRole(input.roleId)
    if (await this.accounts.findByUserId(input.userId)) {
      throw new AppError('VALIDATION_ERROR', 'User ID is already in use')
    }
    const id = await this.accounts.create({
      userId: input.userId,
      displayName: input.displayName,
      email: input.email,
      roleId: input.roleId,
      passwordHash: await this.passwords.hash(input.password),
    })
    await this.audit(meta.actorStaffId, 'staff.account.created', meta, 'staff_account', String(id))
    return { id }
  }

  async updateAccount(
    staffId: number,
    input: StaffUpdateAccountRequestDTO,
    meta: StaffAuthRequestMeta,
  ): Promise<void> {
    if (input.roleId !== undefined) this.assertKnownRole(input.roleId)
    if (!(await this.accounts.findById(staffId))) {
      throw new AppError('NOT_FOUND', 'Staff account not found')
    }
    await this.accounts.update(staffId, input)
    await this.audit(
      meta.actorStaffId,
      'staff.account.updated',
      meta,
      'staff_account',
      String(staffId),
    )
  }

  async resetOtp(staffId: number, meta: StaffAuthRequestMeta): Promise<void> {
    await this.challenges.invalidateActive(staffId, new Date())
    await this.audit(
      meta.actorStaffId,
      'staff.account.otp_reset',
      meta,
      'staff_account',
      String(staffId),
    )
  }

  private async issueOtp(account: StaffAccount): Promise<string> {
    const challengeToken = this.tokens.create()
    const code = this.otp.generate()
    await this.challenges.create({
      challengeTokenHash: this.tokens.hash(challengeToken),
      staffAccountId: account.id,
      otpHash: this.otp.hash(code),
      expiresAt: new Date(Date.now() + this.config.otpExpiresMin * 60 * 1000),
    })
    await this.email.sendOtp(account.email, code, 'スタッフログイン')
    return challengeToken
  }

  private async requireChallenge(challengeToken: string | null) {
    if (!challengeToken) throw new AppError('UNAUTHORIZED', 'OTP challenge not found')
    const challenge = await this.challenges.findActiveByTokenHash(
      this.tokens.hash(challengeToken),
      new Date(),
    )
    if (!challenge) throw new AppError('UNAUTHORIZED', 'OTP challenge expired')
    return challenge
  }

  private isLocked(account: StaffAccount, now: Date): boolean {
    return account.lockedUntil !== null && account.lockedUntil > now
  }

  private async recordLoginFailure(account: StaffAccount, now: Date): Promise<void> {
    const failures = account.failedLoginCount + 1
    if (failures >= this.config.maxLoginFailures) {
      await this.accounts.recordLoginFailure(
        account.id,
        0,
        new Date(now.getTime() + this.config.lockMin * 60 * 1000),
      )
      return
    }
    await this.accounts.recordLoginFailure(account.id, failures, null)
  }

  private unknownHash(): Promise<string> {
    this.unknownPasswordHash ??= this.passwords.hash('unknown-staff-account')
    return this.unknownPasswordHash
  }

  private assertKnownRole(roleId: number): void {
    if (!getStaffRole(roleId)) throw new AppError('VALIDATION_ERROR', 'Unknown role ID')
  }

  private assertRateLimit(key: string, max: number): void {
    if (!this.rateLimiter.check(key, max, 10 * 60 * 1000)) {
      throw new AppError('OTP_ATTEMPTS_EXCEEDED', 'Too many requests. Try again later')
    }
  }

  private async audit(
    staffAccountId: number | null,
    action: string,
    meta: StaffAuthRequestMeta,
    targetType?: string,
    targetId?: string,
  ): Promise<void> {
    await this.auditLogs.record({
      staffAccountId,
      action,
      targetType,
      targetId,
      requestId: meta.requestId,
      ipAddress: meta.ipAddress,
    })
  }
}

function toProfile(account: StaffAccount): StaffProfileDTO {
  const role = getStaffRole(account.roleId)
  return {
    id: account.id,
    userId: account.userId,
    displayName: account.displayName,
    roleId: account.roleId,
    roleName: role?.name,
    permissions: role?.permissions ?? [],
  }
}

function toAccountDTO(account: StaffAccount): StaffAccountDTO {
  return {
    ...toProfile(account),
    email: account.email,
    status: account.status,
    lastLoginAt: account.lastLoginAt ? account.lastLoginAt.toISOString() : null,
  }
}
