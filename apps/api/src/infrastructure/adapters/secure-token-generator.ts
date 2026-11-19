import { createHash, randomBytes } from 'node:crypto'
import type { TokenGenerator } from '#application/ports/token-generator.js'

export class SecureTokenGenerator implements TokenGenerator {
  create(): string {
    return randomBytes(32).toString('base64url')
  }

  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }
}
