export interface OtpCodeGenerator {
  generate(): string
  hash(code: string): string
}
