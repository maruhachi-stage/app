import type { EmailSender } from '#application/ports/email-sender.js'
import {
  sendOtpEmail,
  sendReservationEmail,
  type EmailConfig,
  type ReservationEmailParams,
} from '#lib/email.js'

/** Resend-backed implementation; delivery details are isolated from the use case. */
export class ResendEmailSender implements EmailSender {
  constructor(private readonly config: EmailConfig) {}

  sendOtp(to: string, code: string, subject?: string): Promise<void> {
    return sendOtpEmail(this.config, to, code, subject)
  }

  sendReservation(params: ReservationEmailParams): Promise<void> {
    return sendReservationEmail(this.config, params)
  }
}
