import type { OtpPurpose } from '#application/dto/auth.js'

export type OtpToken = {
  id: number
  memberId: number
  tokenHash: string
  purpose: OtpPurpose
  expiresAt: Date | string
  usedAt: Date | string | null
  failedAttempts: number
  lockedUntil: Date | string | null
  createdAt?: Date | string
}
