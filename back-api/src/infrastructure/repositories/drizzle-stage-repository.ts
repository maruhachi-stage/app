import { alias } from 'drizzle-orm/sqlite-core'
import { and, asc, desc, eq, gte, lt, ne, sql } from 'drizzle-orm'
import { db } from '#infrastructure/database/sqlite.js'
import {
  reservations,
  reservationSeats,
  schedules,
  screens,
  screenings,
} from '#infrastructure/database/schema.js'
import type { Stage } from '#domain/entities/stage.js'
import type { StageSchedule } from '#domain/entities/stage-schedule.js'
import type {
  FindStagesCriteria,
  StageRepository,
} from '#domain/interfaces/repositories/stage-repository.js'
import { jstDateUtcRange } from '#lib/jst-date-range.js'
import { screeningThumbnail } from './screening-thumbnail.js'

const reservedSeats = alias(reservationSeats, 'reserved_seats')
const seatReservations = alias(reservations, 'seat_reservations')

const remainingSeats = (now: Date) => sql<number>`${screens.totalSeats} - COALESCE((
  SELECT COUNT(*) FROM ${reservedSeats}
  JOIN ${seatReservations} ON ${seatReservations.id} = ${reservedSeats.reservationId}
  WHERE ${reservedSeats.scheduleId} = ${schedules.id}
    AND (${seatReservations.status} = 'confirmed' OR (${seatReservations.status} = 'pending' AND ${seatReservations.expiresAt} > ${now.getTime()}))
), 0)`

const toStage = (row: {
  id: number
  type: 'stage' | 'event'
  title: string
  description: string
  durationMin: number
  thumbnailUrl: string | null
  status: 'now_showing' | 'coming_soon'
  playwright: string | null
  director: string | null
}): Stage => row

export class DrizzleStageRepository implements StageRepository {
  async findById(stageId: number): Promise<Stage | null> {
    const [row] = await db
      .select({
        id: screenings.id,
        type: screenings.type,
        title: screenings.title,
        description: screenings.description,
        durationMin: screenings.durationMin,
        thumbnailUrl: screeningThumbnail,
        status: screenings.status,
        playwright: screenings.playwright,
        director: screenings.director,
      })
      .from(screenings)
      .where(and(eq(screenings.id, stageId), ne(screenings.type, 'movie')))
    return row ? toStage(row as Stage) : null
  }

  async findSchedulesByStageId(stageId: number, date?: string): Promise<StageSchedule[]> {
    const conditions = [eq(schedules.screeningId, stageId), eq(schedules.isPublic, true)]
    if (date) {
      const { start, end } = jstDateUtcRange(date)
      conditions.push(gte(schedules.startsAt, start), lt(schedules.startsAt, end))
    }
    const rows = await db
      .select({
        scheduleId: schedules.id,
        screenName: screens.name,
        startsAt: schedules.startsAt,
        endsAt: schedules.endsAt,
        remainingSeats: remainingSeats(new Date()),
        totalSeats: screens.totalSeats,
      })
      .from(schedules)
      .innerJoin(screens, eq(screens.id, schedules.screenId))
      .where(and(...conditions))
      .orderBy(asc(schedules.startsAt))
    return rows.map((row) => ({
      ...row,
      remainingSeats: Number(row.remainingSeats),
      totalSeats: Number(row.totalSeats),
    }))
  }

  async findAll(criteria: FindStagesCriteria): Promise<Stage[]> {
    const conditions = [
      criteria.type ? eq(screenings.type, criteria.type) : ne(screenings.type, 'movie'),
    ]
    if (criteria.status) conditions.push(eq(screenings.status, criteria.status))
    if (criteria.date) {
      const { start, end } = jstDateUtcRange(criteria.date)
      conditions.push(sql`${screenings.id} IN (
        SELECT DISTINCT ${schedules.screeningId} FROM ${schedules}
        WHERE ${schedules.isPublic} = true AND ${schedules.startsAt} >= ${start.getTime()} AND ${schedules.startsAt} < ${end.getTime()}
      )`)
    }
    const rows = await db
      .select({
        id: screenings.id,
        type: screenings.type,
        title: screenings.title,
        description: screenings.description,
        durationMin: screenings.durationMin,
        thumbnailUrl: screeningThumbnail,
        status: screenings.status,
        playwright: screenings.playwright,
        director: screenings.director,
      })
      .from(screenings)
      .where(and(...conditions))
      .orderBy(desc(screenings.createdAt))
    return rows.map((row) => toStage(row as Stage))
  }
}
