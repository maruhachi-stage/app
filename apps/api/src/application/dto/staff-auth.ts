import { z } from 'zod'

export const staffLoginRequestSchema = z.object({
  userId: z.string().min(3).max(80),
  password: z.string().min(8).max(200),
})

export const staffVerifyOtpRequestSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
})

export const staffChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(8).max(200),
  newPassword: z.string().min(12).max(200),
})

export const staffCreateAccountRequestSchema = z.object({
  userId: z.string().min(3).max(80),
  displayName: z.string().min(1).max(100),
  email: z.string().email().max(254),
  password: z.string().min(12).max(200),
  roleId: z.number().int(),
})

export const staffUpdateAccountRequestSchema = staffCreateAccountRequestSchema
  .omit({ password: true })
  .partial()
  .extend({ status: z.enum(['active', 'suspended']).optional() })

export type StaffLoginRequestDTO = z.infer<typeof staffLoginRequestSchema>
export type StaffVerifyOtpRequestDTO = z.infer<typeof staffVerifyOtpRequestSchema>
export type StaffChangePasswordRequestDTO = z.infer<typeof staffChangePasswordRequestSchema>
export type StaffCreateAccountRequestDTO = z.infer<typeof staffCreateAccountRequestSchema>
export type StaffUpdateAccountRequestDTO = z.infer<typeof staffUpdateAccountRequestSchema>

export type StaffProfileDTO = {
  id: number
  userId: string
  displayName: string
  roleId: number
  roleName: string | undefined
  permissions: readonly string[]
}

export type StaffAccountDTO = StaffProfileDTO & {
  email: string
  status: string
  lastLoginAt: string | null
}

export type StaffLoginResponseDTO = {
  otpRequired: true
  expiresInSec: number
}

export type StaffVerifyOtpResponseDTO = {
  authenticated: true
  staff: StaffProfileDTO
}

export type StaffMeResponseDTO =
  { authenticated: false } | { authenticated: true; staff: StaffProfileDTO }
