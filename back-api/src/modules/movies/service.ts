import type mysql from 'mysql2/promise'
import { pool } from '#db/client.js'

export type MovieRow = {
  id: number
  title: string
  description: string
  duration_min: number
  thumbnail_url: string | null
  status: 'now_showing' | 'coming_soon'
}

export type ScheduleRow = {
  schedule_id: number
  screen_name: string
  starts_at: Date | string
  ends_at: Date | string
  remaining_seats: number
  total_seats: number
}

export type FullScheduleRow = {
  schedule_id: number
  movie_id: number
  movie_title: string
  thumbnail_url: string | null
  duration_min: number
  screen_name: string
  screen_id: number
  starts_at: Date | string
  ends_at: Date | string
  remaining_seats: number
  total_seats: number
}

export async function getMovieById(movieId: number): Promise<MovieRow | null> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT m.id, m.title, m.description, m.duration_min, m.status,
      (SELECT file_name FROM movie_images WHERE movie_id = m.id ORDER BY display_order LIMIT 1) AS thumbnail_url
     FROM movies m WHERE m.id = ?`,
    [movieId],
  )
  return (rows[0] as MovieRow) || null
}

export async function getSchedulesByMovieId(movieId: number, date?: string): Promise<ScheduleRow[]> {
  let sql = `
    SELECT
      sch.id as schedule_id,
      sc.name as screen_name,
      sch.starts_at,
      sch.ends_at,
      sc.total_seats,
      sc.total_seats - COALESCE((
        SELECT COUNT(*) FROM reservation_seats rs
        JOIN reservations r ON r.id = rs.reservation_id
        WHERE rs.schedule_id = sch.id
        AND (r.status = 'confirmed' OR (r.status = 'pending' AND r.expires_at > CURRENT_TIMESTAMP(3)))
      ), 0) as remaining_seats
    FROM schedules sch
    JOIN screens sc ON sc.id = sch.screen_id
    WHERE sch.movie_id = ? AND sch.is_public = 1`

  const params: (string | number)[] = [movieId]
  if (date) {
    sql += ` AND DATE(CONVERT_TZ(sch.starts_at, '+00:00', '+09:00')) = ?`
    params.push(date)
  }
  sql += ' ORDER BY sch.starts_at'

  const [rows] = await pool.execute<mysql.RowDataPacket[]>(sql, params)
  return rows as ScheduleRow[]
}

export async function getFullScheduleById(scheduleId: number): Promise<FullScheduleRow | null> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT
       sch.id as schedule_id,
       sch.movie_id,
       m.title as movie_title,
       (SELECT file_name FROM movie_images WHERE movie_id = m.id ORDER BY display_order LIMIT 1) AS thumbnail_url,
       m.duration_min,
       sc.name as screen_name,
       sc.id as screen_id,
       sch.starts_at,
       sch.ends_at,
       sc.total_seats,
       sc.total_seats - COALESCE((
         SELECT COUNT(*) FROM reservation_seats rs
         JOIN reservations r ON r.id = rs.reservation_id
         WHERE rs.schedule_id = sch.id
         AND (r.status = 'confirmed' OR (r.status = 'pending' AND r.expires_at > CURRENT_TIMESTAMP(3)))
       ), 0) as remaining_seats
     FROM schedules sch
     JOIN movies m ON m.id = sch.movie_id
     JOIN screens sc ON sc.id = sch.screen_id
     WHERE sch.id = ? AND sch.is_public = 1`,
    [scheduleId],
  )
  return (rows[0] as FullScheduleRow) || null
}

export async function getMovies(status?: string, date?: string): Promise<MovieRow[]> {
  let sql = `SELECT m.id, m.title, m.description, m.duration_min, m.status,
    (SELECT file_name FROM movie_images WHERE movie_id = m.id ORDER BY display_order LIMIT 1) AS thumbnail_url
  FROM movies m WHERE 1=1`
  const params: (string | number)[] = []

  if (status) {
    sql += ' AND m.status = ?'
    params.push(status)
  }
  if (date) {
    sql += ` AND m.id IN (
      SELECT DISTINCT movie_id FROM schedules
      WHERE is_public = 1 AND DATE(CONVERT_TZ(starts_at, '+00:00', '+09:00')) = ?
    )`
    params.push(date)
  }
  sql += ' ORDER BY m.created_at DESC'

  const [rows] = await pool.execute<mysql.RowDataPacket[]>(sql, params)
  return rows as MovieRow[]
}
