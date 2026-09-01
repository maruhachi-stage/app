import type { EmailSender } from '#application/ports/email-sender.js'
import { sendOtpEmail } from '#lib/email.js'

/** Resend-backed implementation; delivery details are isolated from the use case. */
export class ResendEmailSender implements EmailSender {
  sendOtp(to: string, code: string): Promise<void> {
    return sendOtpEmail(to, code)
  }
}
