const JST_OFFSET_MS = 9 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

export function jstDateUtcRange(date: string): { start: Date; end: Date } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) throw new RangeError('Date must use YYYY-MM-DD format')

  const [, yearText, monthText, dayText] = match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const midnightUtc = new Date(0)
  midnightUtc.setUTCFullYear(year, month - 1, day)
  midnightUtc.setUTCHours(0, 0, 0, 0)

  if (
    midnightUtc.getUTCFullYear() !== year ||
    midnightUtc.getUTCMonth() !== month - 1 ||
    midnightUtc.getUTCDate() !== day
  ) {
    throw new RangeError('Date is not a valid calendar date')
  }

  const start = new Date(midnightUtc.getTime() - JST_OFFSET_MS)
  return { start, end: new Date(start.getTime() + DAY_MS) }
}
