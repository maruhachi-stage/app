import { and, asc, desc, eq, sql } from 'drizzle-orm'
import { db } from '#infrastructure/database/mysqlPool.js'
import { images, reservationSeats, reservations, schedules, screens, screenings } from '#infrastructure/database/schema.js'
import type { Movie } from '#domain/entities/movie.js'
import type { MovieSchedule } from '#domain/entities/movie-schedule.js'
import type { PublicSchedule } from '#domain/entities/public-schedule.js'
import type { MovieRepository } from '#domain/interfaces/repositories/movie-repository.js'

const thumbnailFilename = sql<string | null>`(
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

const hasPublicScheduleOn = (date: string) => sql`
  ${screenings.id} IN (
    SELECT DISTINCT screening_id FROM schedules
    WHERE is_public = 1
      AND DATE(CONVERT_TZ(starts_at, '+00:00', '+09:00')) = ${date}
  )
`

export class MysqlMovieRepository implements MovieRepository {
  async findMovies({ status, date }: { status?: Movie['status']; date?: string }): Promise<Movie[]> {
    const conditions = [eq(screenings.type, 'movie')]
    if (status) conditions.push(eq(screenings.status, status))
    if (date) conditions.push(hasPublicScheduleOn(date))

    const rows = await db.select({
      id: screenings.id,
      title: screenings.title,
      description: screenings.description,
      durationMin: screenings.durationMin,
      status: screenings.status,
      thumbnailFilename,
    }).from(screenings).where(and(...conditions)).orderBy(desc(screenings.createdAt))

    return rows.map((row) => ({ ...row, status: row.status as Movie['status'] }))
  }

  async findMovieById(movieId: number): Promise<Movie | null> {
    const [row] = await db.select({
      id: screenings.id,
      title: screenings.title,
      description: screenings.description,
      durationMin: screenings.durationMin,
      status: screenings.status,
      thumbnailFilename,
    }).from(screenings).where(and(eq(screenings.id, movieId), eq(screenings.type, 'movie')))

    return row ? { ...row, status: row.status as Movie['status'] } : null
  }

  async findSchedulesByMovieId(movieId: number, date?: string): Promise<MovieSchedule[]> {
    const conditions = [eq(schedules.screeningId, movieId), eq(schedules.isPublic, true)]
    if (date) conditions.push(sql`DATE(CONVERT_TZ(${schedules.startsAt}, '+00:00', '+09:00')) = ${date}`)

    const rows = await db.select({
      scheduleId: schedules.id,
      screenName: screens.name,
      startsAt: schedules.startsAt,
      endsAt: schedules.endsAt,
      remainingSeats,
      totalSeats: screens.totalSeats,
    }).from(schedules).innerJoin(screens, eq(screens.id, schedules.screenId))
      .where(and(...conditions)).orderBy(asc(schedules.startsAt))

    return rows.map((row) => ({ ...row, remainingSeats: Number(row.remainingSeats), totalSeats: Number(row.totalSeats) }))
  }

  async findPublicScheduleById(scheduleId: number): Promise<PublicSchedule | null> {
    const [row] = await db.select({
      scheduleId: schedules.id,
      type: screenings.type,
      screeningId: schedules.screeningId,
      title: screenings.title,
      thumbnailFilename,
      durationMin: screenings.durationMin,
      screenName: screens.name,
      startsAt: schedules.startsAt,
      endsAt: schedules.endsAt,
      remainingSeats,
      totalSeats: screens.totalSeats,
    }).from(schedules)
      .innerJoin(screenings, eq(screenings.id, schedules.screeningId))
      .innerJoin(screens, eq(screens.id, schedules.screenId))
      .where(and(eq(schedules.id, scheduleId), eq(schedules.isPublic, true)))

    if (!row) return null
    const isMovie = row.type === 'movie'
    return {
      scheduleId: row.scheduleId,
      type: row.type,
      movieId: isMovie ? row.screeningId : null,
      movieTitle: isMovie ? row.title : null,
      stageId: isMovie ? null : row.screeningId,
      stageTitle: isMovie ? null : row.title,
      thumbnailFilename: row.thumbnailFilename,
      durationMin: row.durationMin,
      screenName: row.screenName,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      remainingSeats: Number(row.remainingSeats),
      totalSeats: Number(row.totalSeats),
    }
  }
}
