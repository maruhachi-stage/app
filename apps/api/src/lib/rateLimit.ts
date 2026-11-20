type Entry = { timestamps: number[] }

const store = new Map<string, Entry>()
const SWEEP_INTERVAL_MS = 5 * 60 * 1000

let lastSweep = 0

/**
 * Isolate-local limiter. The Workers runtime forbids timers at module scope, so
 * stale keys are pruned opportunistically on each check instead of by interval.
 */
function sweep(now: number): void {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return
  lastSweep = now
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < 10 * 60 * 1000)
    if (entry.timestamps.length === 0) store.delete(key)
  }
}

export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  sweep(now)

  const entry = store.get(key) ?? { timestamps: [] }
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs)

  if (entry.timestamps.length >= max) {
    store.set(key, entry)
    return false
  }

  entry.timestamps.push(now)
  store.set(key, entry)
  return true
}
