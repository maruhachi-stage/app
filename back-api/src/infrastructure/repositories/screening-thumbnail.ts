import { sql } from 'drizzle-orm'

/**
 * The outer query must use the `screenings` table without an alias.
 * Qualifying the outer id is important because the subquery also has an `id`
 * column on `images`.
 */
export const screeningThumbnail = sql<string | null>`(
  SELECT i.file_name
  FROM images AS i
  WHERE i.entity_type = 'screening'
    AND i.entity_id = screenings.id
  ORDER BY i.display_order ASC, i.id ASC
  LIMIT 1
)`
