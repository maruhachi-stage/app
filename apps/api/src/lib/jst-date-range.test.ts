import { describe, expect, it } from 'vitest'
import { jstDateUtcRange } from './jst-date-range.js'

describe('jstDateUtcRange', () => {
  it('converts JST midnight boundaries to a 24-hour UTC range', () => {
    const range = jstDateUtcRange('2026-09-25')

    expect(range.start.toISOString()).toBe('2026-09-24T15:00:00.000Z')
    expect(range.end.toISOString()).toBe('2026-09-25T15:00:00.000Z')
  })

  it('rejects invalid calendar dates', () => {
    expect(() => jstDateUtcRange('2026-02-30')).toThrow(RangeError)
  })
})
