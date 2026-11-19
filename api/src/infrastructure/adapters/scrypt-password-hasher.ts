import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import type { PasswordHasher } from '#application/ports/password-hasher.js'

const scrypt = promisify(scryptCallback)
const KEY_LENGTH = 64
const SALT_LENGTH = 16
const SCHEME = 'scrypt'

/**
 * Password hashing with Node.js built-in scrypt so the API keeps a dependency-free
 * runtime. The hash string is self-describing: scrypt$<salt>$<derivedKey>.
 */
export class ScryptPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH).toString('hex')
    const derived = (await scrypt(password, salt, KEY_LENGTH)) as Buffer
    return `${SCHEME}$${salt}$${derived.toString('hex')}`
  }

  async verify(hash: string, password: string): Promise<boolean> {
    const [scheme, salt, expectedHex] = hash.split('$')
    if (scheme !== SCHEME || !salt || !expectedHex) return false
    const expected = Buffer.from(expectedHex, 'hex')
    if (expected.length !== KEY_LENGTH) return false
    const derived = (await scrypt(password, salt, KEY_LENGTH)) as Buffer
    return timingSafeEqual(expected, derived)
  }
}
