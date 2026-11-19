import { describe, expect, it } from 'vitest'
import { drizzle } from 'drizzle-orm/d1'
import { screenings } from '#infrastructure/database/schema.js'
import { screeningThumbnail } from './screening-thumbnail.js'

describe('screeningThumbnail', () => {
  it('qualifies the outer screening id in the image subquery', () => {
    // SQL 生成だけを検証するため、D1 クライアントはダミーで構いません。
    const db = drizzle({} as unknown as D1Database)
    const query = db.select({ thumbnail: screeningThumbnail }).from(screenings).toSQL()

    expect(query.sql).toContain('i.entity_id = screenings.id')
    expect(query.sql).not.toContain('i.entity_id = "id"')
  })
})
