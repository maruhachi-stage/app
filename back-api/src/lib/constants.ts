export const TICKET_PRICES = {
  general: 1800,
  university: 1600,
  highschool: 1400,
  child: 1000,
} as const

export const TICKET_LABELS = {
  general: '一般',
  university: '大学生',
  highschool: '高校生以下',
  child: '子供',
} as const

export type TicketType = keyof typeof TICKET_PRICES

export const OTP_CONFIG = {
  EXPIRES_MIN: 10,
  RESEND_SEC: 60,
  MAX_ATTEMPTS: 5,
  LOCK_MIN: 15,
} as const

export const RESERVATION_CONFIG = {
  HOLD_EXPIRES_MIN: 15,
} as const
