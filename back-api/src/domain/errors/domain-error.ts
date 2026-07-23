export type DomainErrorCode =
  | 'OTP_EXPIRED' | 'OTP_INVALID' | 'OTP_ATTEMPTS_EXCEEDED' | 'OTP_RESEND_COOLDOWN'
  | 'UNAUTHORIZED' | 'NOT_FOUND'

export class DomainError extends Error {
  constructor(readonly code: DomainErrorCode, message: string) {
    super(message)
    this.name = 'DomainError'
  }
}
