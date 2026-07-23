type Entry = { timestamps: number[] }

const store = new Map<string, Entry>()

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter(t => now - t < 10 * 60 * 1000)
    if (entry.timestamps.length === 0) store.delete(key)
  }
}, 5 * 60 * 1000)

export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key) ?? { timestamps: [] }
  entry.timestamps = entry.timestamps.filter(t => now - t < windowMs)

  if (entry.timestamps.length >= max) {
    store.set(key, entry)
    return false
  }

  entry.timestamps.push(now)
  store.set(key, entry)
  return true
}
