import type {
  SendOtpRequestDTO,
  SendOtpResponseDTO,
  VerifyOtpRequestDTO,
  VerifyOtpResponseDTO,
} from '#application/dto/auth.js'
import type { EmailSender } from '#application/ports/email-sender.js'
import type { OtpCodeGenerator } from '#application/ports/otp-code-generator.js'
import type { RateLimiter } from '#application/ports/rate-limiter.js'
import { DomainError } from '#domain/errors/domain-error.js'
import type { MemberRepository } from '#domain/interfaces/repositories/member-repository.js'
import type { OtpTokenRepository } from '#domain/interfaces/repositories/otp-token-repository.js'

export class AuthService {
  constructor(
    private readonly members: MemberRepository,
    private readonly tokens: OtpTokenRepository,
    private readonly email: EmailSender,
    private readonly otp: OtpCodeGenerator,
    private readonly rateLimiter: RateLimiter,
    private readonly config: {
      expiresMin: number
      resendSec: number
      maxAttempts: number
      lockMin: number
    },
  ) {}

  async sendOtp(input: SendOtpRequestDTO, ip: string): Promise<SendOtpResponseDTO> {
    this.assertRateLimits('send', input.email, ip, 'OTP_RESEND_COOLDOWN')
    const memberId = await this.members.getOrCreateByEmail(input.email)
    if (await this.tokens.findRecent(memberId, input.type, this.config.resendSec)) {
      throw new DomainError(
        'OTP_RESEND_COOLDOWN',
        `Wait ${this.config.resendSec} seconds before resending`,
      )
    }
    const code = this.otp.generate()
    await this.tokens.create(
      memberId,
      this.otp.hash(code),
      input.type,
      new Date(Date.now() + this.config.expiresMin * 60 * 1000),
    )
    await this.email.sendOtp(input.email, code)
    return { expiresInSec: this.config.expiresMin * 60, resendAfterSec: this.config.resendSec }
  }

  async verifyOtp(input: VerifyOtpRequestDTO, ip: string): Promise<VerifyOtpResponseDTO> {
    this.assertRateLimits('verify', input.email, ip, 'OTP_ATTEMPTS_EXCEEDED')
    const member = await this.members.findByEmail(input.email)
    if (!member) throw new DomainError('OTP_INVALID', 'Invalid OTP')
    const token = await this.tokens.findLatest(member.id, input.type)
    if (!token) throw new DomainError('OTP_INVALID', 'Invalid OTP')
    if (token.lockedUntil && new Date(token.lockedUntil) > new Date())
      throw new DomainError('OTP_ATTEMPTS_EXCEEDED', `Account locked until ${token.lockedUntil}`)
    if (new Date(token.expiresAt) < new Date())
      throw new DomainError('OTP_EXPIRED', 'OTP has expired')
    if (token.usedAt) throw new DomainError('OTP_INVALID', 'OTP already used')
    if (this.otp.hash(input.code) !== token.tokenHash) {
      const attempts = token.failedAttempts + 1
      if (attempts >= this.config.maxAttempts) {
        await this.tokens.recordFailure(
          token.id,
          attempts,
          new Date(Date.now() + this.config.lockMin * 60 * 1000),
        )
        throw new DomainError('OTP_ATTEMPTS_EXCEEDED', 'Too many failed attempts. Account locked.')
      }
      await this.tokens.recordFailure(token.id, attempts)
      throw new DomainError('OTP_INVALID', 'Invalid OTP')
    }
    await this.tokens.markUsed(token.id)
    return { memberId: member.id, authenticated: true }
  }

  private assertRateLimits(
    action: 'send' | 'verify',
    email: string,
    ip: string,
    errorCode: 'OTP_RESEND_COOLDOWN' | 'OTP_ATTEMPTS_EXCEEDED',
  ): void {
    if (!this.rateLimiter.check(`otp:${action}:ip:${ip}`, 10, 10 * 60 * 1000)) {
      throw new DomainError(
        errorCode,
        action === 'send'
          ? 'Too many requests from this IP'
          : 'Too many verification attempts from this IP',
      )
    }
    if (!this.rateLimiter.check(`otp:${action}:email:${email}`, 5, 10 * 60 * 1000)) {
      throw new DomainError(
        errorCode,
        action === 'send'
          ? 'Too many OTP requests for this email'
          : 'Too many verification attempts for this email',
      )
    }
  }
}
