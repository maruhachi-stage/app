import { and, asc, desc, eq, ne, sql } from 'drizzle-orm'
import { db } from '#infrastructure/database/mysqlPool.js'
import { images, schedules, screens, screenings } from '#infrastructure/database/schema.js'
import type { Stage } from '#domain/entities/stage.js'
import type { StageSchedule } from '#domain/entities/stage-schedule.js'
import type { FindStagesCriteria, StageRepository } from '#domain/interfaces/repositories/stage-repository.js'

const thumbnailUrl = sql<string | null>`(
  SELECT file_name FROM images
  WHERE entity_type = 'screening' AND entity_id = ${screenings.id}
  ORDER BY display_order LIMIT 1
)`

const remainingSeats = sql<number>`${screens.totalSeats} - COALESCE((
  SELECT COUNT(*) FROM reservation_seats rs
  JOIN reservations r ON r.id = rs.reservation_id
  WHERE rs.schedule_id = ${schedules.id}
    AND (r.status = 'confirmed' OR (r.status = 'pending' AND r.expires_at > CURRENT_TIMESTAMP(3)))
), 0)`

const toStage = (row: {
  id: number; type: 'stage' | 'event'; title: string; description: string; durationMin: number
  thumbnailUrl: string | null; status: 'now_showing' | 'coming_soon'; playwright: string | null; director: string | null
}): Stage => row

export class MysqlStageRepository implements StageRepository {
  async findById(stageId: number): Promise<Stage | null> {
    const [row] = await db.select({
      id: screenings.id, type: screenings.type, title: screenings.title, description: screenings.description,
      durationMin: screenings.durationMin, thumbnailUrl, status: screenings.status,
      playwright: screenings.playwright, director: screenings.director,
    }).from(screenings).where(and(eq(screenings.id, stageId), ne(screenings.type, 'movie')))
    return row ? toStage(row as Stage) : null
  }

  async findSchedulesByStageId(stageId: number, date?: string): Promise<StageSchedule[]> {
    const conditions = [eq(schedules.screeningId, stageId), eq(schedules.isPublic, true)]
    if (date) conditions.push(sql`DATE(CONVERT_TZ(${schedules.startsAt}, '+00:00', '+09:00')) = ${date}`)
    const rows = await db.select({
      scheduleId: schedules.id, screenName: screens.name, startsAt: schedules.startsAt, endsAt: schedules.endsAt,
      remainingSeats, totalSeats: screens.totalSeats,
    }).from(schedules).innerJoin(screens, eq(screens.id, schedules.screenId))
      .where(and(...conditions)).orderBy(asc(schedules.startsAt))
    return rows.map((row) => ({ ...row, remainingSeats: Number(row.remainingSeats), totalSeats: Number(row.totalSeats) }))
  }

  async findAll(criteria: FindStagesCriteria): Promise<Stage[]> {
    const conditions = [criteria.type ? eq(screenings.type, criteria.type) : ne(screenings.type, 'movie')]
    if (criteria.status) conditions.push(eq(screenings.status, criteria.status))
    if (criteria.date) conditions.push(sql`${screenings.id} IN (
      SELECT DISTINCT screening_id FROM schedules
      WHERE is_public = 1 AND DATE(CONVERT_TZ(starts_at, '+00:00', '+09:00')) = ${criteria.date}
    )`)
    const rows = await db.select({
      id: screenings.id, type: screenings.type, title: screenings.title, description: screenings.description,
      durationMin: screenings.durationMin, thumbnailUrl, status: screenings.status,
      playwright: screenings.playwright, director: screenings.director,
    }).from(screenings).where(and(...conditions)).orderBy(desc(screenings.createdAt))
    return rows.map((row) => toStage(row as Stage))
  }
}
