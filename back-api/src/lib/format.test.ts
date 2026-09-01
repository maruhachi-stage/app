import { describe, expect, it } from 'vitest'

import { imageUrl, maskEmail } from './format.js'

describe('format helpers', () => {
  it('masks the local part of an email address', () => {
    expect(maskEmail('taro@example.com')).toBe('ta***@example.com')
    expect(maskEmail('a@example.com')).toBe('a***@example.com')
  })

  it('builds image URLs and preserves absolute URLs', () => {
    expect(imageUrl('poster.png')).toBe('http://localhost:3001/images/poster.png')
    expect(imageUrl('https://cdn.example.com/poster.png')).toBe(
      'https://cdn.example.com/poster.png',
    )
    expect(imageUrl(null)).toBeNull()
  })
})
