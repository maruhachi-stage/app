export interface EmailSender { sendOtp(to: string, code: string): Promise<void> }
