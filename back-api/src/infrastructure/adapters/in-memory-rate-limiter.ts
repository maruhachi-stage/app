import type { RateLimiter } from '#application/ports/rate-limiter.js'
import { checkRateLimit } from '#lib/rateLimit.js'

export class InMemoryRateLimiter implements RateLimiter {
  check(key: string, max: number, windowMs: number): boolean {
    return checkRateLimit(key, max, windowMs)
  }
}
