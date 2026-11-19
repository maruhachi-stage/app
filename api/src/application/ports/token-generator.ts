/** Opaque tokens for staff sessions and OTP challenges. Only their hashes are stored. */
export interface TokenGenerator {
  create(): string
  hash(token: string): string
}
