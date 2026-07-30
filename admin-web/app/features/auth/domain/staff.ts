export type StaffRole = {
  id: number
  key: string
  name: string
  permissions: string[]
}

export type AuthenticatedStaff = {
  id: number
  userId: string
  displayName: string
  role: StaffRole
}

export type LoginResult = {
  otpRequired: true
  expiresAt: string
}
