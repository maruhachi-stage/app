import type { OtpCodeGenerator } from '#application/ports/otp-code-generator.js'
import { generateOtp, hashOtp } from '#utils/otp.js'

export class CryptoOtpCodeGenerator implements OtpCodeGenerator {
  generate(): string { return generateOtp() }
  hash(code: string): string { return hashOtp(code) }
}
