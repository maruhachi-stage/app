import type { ReservationEmailParams } from '#lib/email.js'

export interface EmailSender {
  /** `subject` lets each flow label its own code while sharing the transport. */
  sendOtp(to: string, code: string, subject?: string): Promise<void>
  /** Reservation receipts share the transport but have their own template. */
  sendReservation(params: ReservationEmailParams): Promise<void>
}
