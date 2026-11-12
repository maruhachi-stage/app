export interface EmailSender {
  /** `subject` lets each flow label its own code while sharing the transport. */
  sendOtp(to: string, code: string, subject?: string): Promise<void>
}
