import type mysql from 'mysql2/promise'
import { mysqlPool as pool } from '#infrastructure/database/mysqlPool.js'
import type { Movie } from '#domain/entities/movie.js'
import type { MovieSchedule } from '#domain/entities/movie-schedule.js'
import type { PublicSchedule } from '#domain/entities/public-schedule.js'
import type { MovieRepository } from '#domain/interfaces/repositories/movie-repository.js'

type MovieRow = mysql.RowDataPacket & {
  id: number
  title: string
  description: string
  duration_min: number
  thumbnail_url: string | null
  status: Movie['status']
}

type MovieScheduleRow = mysql.RowDataPacket & {
  schedule_id: number
  screen_name: string
  starts_at: Date | string
  ends_at: Date | string
  remaining_seats: number
  total_seats: number
}

type PublicScheduleRow = mysql.RowDataPacket & {
  schedule_id: number
  type: PublicSchedule['type']
  movie_id: number | null
  movie_title: string | null
  stage_id: number | null
  stage_title: string | null
  thumbnail_url: string | null
  duration_min: number
  screen_name: string
  starts_at: Date | string
  ends_at: Date | string
  remaining_seats: number
  total_seats: number
}

export class MysqlMovieRepository implements MovieRepository {
  async findMovies({ status, date }: { status?: Movie['status']; date?: string }): Promise<Movie[]> {
    let sql = `SELECT m.id, m.title, m.description, m.duration_min, m.status,
      (SELECT file_name FROM images WHERE entity_type = 'screening' AND entity_id = m.id ORDER BY display_order LIMIT 1) AS thumbnail_url
      FROM screenings m WHERE m.type = 'movie'`
    const params: (string | number)[] = []
    if (status) { sql += ' AND m.status = ?'; params.push(status) }
    if (date) {
      sql += ` AND m.id IN (SELECT DISTINCT screening_id FROM schedules WHERE is_public = 1 AND DATE(CONVERT_TZ(starts_at, '+00:00', '+09:00')) = ?)`
      params.push(date)
    }
    sql += ' ORDER BY m.created_at DESC'
    const [rows] = await pool.execute<MovieRow[]>(sql, params)
    return rows.map((row) => this.toMovie(row))
  }

  async findMovieById(movieId: number): Promise<Movie | null> {
    const [rows] = await pool.execute<MovieRow[]>(
      `SELECT m.id, m.title, m.description, m.duration_min, m.status,
        (SELECT file_name FROM images WHERE entity_type = 'screening' AND entity_id = m.id ORDER BY display_order LIMIT 1) AS thumbnail_url
       FROM screenings m WHERE m.id = ? AND m.type = 'movie'`, [movieId],
    )
    return rows[0] ? this.toMovie(rows[0]) : null
  }

  async findSchedulesByMovieId(movieId: number, date?: string): Promise<MovieSchedule[]> {
    let sql = `SELECT sch.id as schedule_id, sc.name as screen_name, sch.starts_at, sch.ends_at, sc.total_seats,
      sc.total_seats - COALESCE((SELECT COUNT(*) FROM reservation_seats rs JOIN reservations r ON r.id = rs.reservation_id
        WHERE rs.schedule_id = sch.id AND (r.status = 'confirmed' OR (r.status = 'pending' AND r.expires_at > CURRENT_TIMESTAMP(3)))), 0) as remaining_seats
      FROM schedules sch JOIN screens sc ON sc.id = sch.screen_id WHERE sch.screening_id = ? AND sch.is_public = 1`
    const params: (string | number)[] = [movieId]
    if (date) { sql += ` AND DATE(CONVERT_TZ(sch.starts_at, '+00:00', '+09:00')) = ?`; params.push(date) }
    sql += ' ORDER BY sch.starts_at'
    const [rows] = await pool.execute<MovieScheduleRow[]>(sql, params)
    return rows.map((row) => ({ scheduleId: row.schedule_id, screenName: row.screen_name, startsAt: row.starts_at, endsAt: row.ends_at, remainingSeats: Number(row.remaining_seats), totalSeats: Number(row.total_seats) }))
  }

  async findPublicScheduleById(scheduleId: number): Promise<PublicSchedule | null> {
    const [rows] = await pool.execute<PublicScheduleRow[]>(
      `SELECT sch.id as schedule_id, item.type, IF(item.type = 'movie', sch.screening_id, NULL) as movie_id,
        IF(item.type = 'movie', item.title, NULL) as movie_title, IF(item.type <> 'movie', sch.screening_id, NULL) as stage_id,
        IF(item.type <> 'movie', item.title, NULL) as stage_title,
        (SELECT file_name FROM images WHERE entity_type = 'screening' AND entity_id = item.id ORDER BY display_order LIMIT 1) AS thumbnail_url,
        item.duration_min, sc.name as screen_name, sch.starts_at, sch.ends_at, sc.total_seats,
        sc.total_seats - COALESCE((SELECT COUNT(*) FROM reservation_seats rs JOIN reservations r ON r.id = rs.reservation_id
          WHERE rs.schedule_id = sch.id AND (r.status = 'confirmed' OR (r.status = 'pending' AND r.expires_at > CURRENT_TIMESTAMP(3)))), 0) as remaining_seats
       FROM schedules sch JOIN screenings item ON item.id = sch.screening_id JOIN screens sc ON sc.id = sch.screen_id
       WHERE sch.id = ? AND sch.is_public = 1`, [scheduleId],
    )
    const row = rows[0]
    return row ? { scheduleId: row.schedule_id, type: row.type, movieId: row.movie_id, movieTitle: row.movie_title, stageId: row.stage_id, stageTitle: row.stage_title, thumbnailFilename: row.thumbnail_url, durationMin: row.duration_min, screenName: row.screen_name, startsAt: row.starts_at, endsAt: row.ends_at, remainingSeats: Number(row.remaining_seats), totalSeats: Number(row.total_seats) } : null
  }

  private toMovie(row: MovieRow): Movie {
    return { id: row.id, title: row.title, description: row.description, durationMin: row.duration_min, thumbnailFilename: row.thumbnail_url, status: row.status }
  }
}
