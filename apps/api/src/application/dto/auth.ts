import { z } from 'zod'

export const sendOtpRequestSchema = z.object({
  email: z.string().email().max(254),
  type: z.enum(['login', 'register']),
})

export const verifyOtpRequestSchema = z.object({
  email: z.string().email().max(254),
  code: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
  type: z.enum(['login', 'register']),
})

export type SendOtpRequestDTO = z.infer<typeof sendOtpRequestSchema>
export type VerifyOtpRequestDTO = z.infer<typeof verifyOtpRequestSchema>
export type OtpPurpose = SendOtpRequestDTO['type']
export type SendOtpResponseDTO = { expiresInSec: number; resendAfterSec: number }
export type VerifyOtpResponseDTO = { memberId: number; authenticated: true }
