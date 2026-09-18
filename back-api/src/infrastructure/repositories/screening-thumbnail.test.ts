import { describe, expect, it } from 'vitest'
import { db } from '#infrastructure/database/mysqlPool.js'
import { screenings } from '#infrastructure/database/schema.js'
import { screeningThumbnail } from './screening-thumbnail.js'

describe('screeningThumbnail', () => {
  it('qualifies the outer screening id in the image subquery', () => {
    const query = db.select({ thumbnail: screeningThumbnail }).from(screenings).toSQL()

    expect(query.sql).toContain('i.entity_id = screenings.id')
    expect(query.sql).not.toContain('i.entity_id = `id`')
  })
})
