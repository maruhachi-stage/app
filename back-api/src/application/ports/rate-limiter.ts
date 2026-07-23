export interface RateLimiter { check(key: string, max: number, windowMs: number): boolean }
