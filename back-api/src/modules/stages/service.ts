import type mysql from 'mysql2/promise'
import { pool } from '#db/client.js'

export type StageRow = {
  id: number
  title: string
  description: string
  duration_min: number
  thumbnail_url: string | null
  status: 'now_showing' | 'coming_soon'
  playwright: string | null
  director: string | null
}

export type ScheduleRow = {
  schedule_id: number
  screen_name: string
  starts_at: Date | string
  ends_at: Date | string
  remaining_seats: number
  total_seats: number
}

export async function getStageById(stageId: number): Promise<StageRow | null> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT s.id, s.title, s.description, s.duration_min, s.status, s.playwright, s.director,
      (SELECT file_name FROM images WHERE entity_type = 'screening' AND entity_id = s.id ORDER BY display_order LIMIT 1) AS thumbnail_url
     FROM screenings s WHERE s.id = ? AND s.type <> 'movie'`,
    [stageId],
  )
  return (rows[0] as StageRow) || null
}

export async function getSchedulesByStageId(stageId: number, date?: string): Promise<ScheduleRow[]> {
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
    WHERE sch.screening_id = ? AND sch.is_public = 1`

  const params: (string | number)[] = [stageId]
  if (date) {
    sql += ` AND DATE(CONVERT_TZ(sch.starts_at, '+00:00', '+09:00')) = ?`
    params.push(date)
  }
  sql += ' ORDER BY sch.starts_at'

  const [rows] = await pool.execute<mysql.RowDataPacket[]>(sql, params)
  return rows as ScheduleRow[]
}

export async function getStages(status?: string, date?: string): Promise<StageRow[]> {
  let sql = `SELECT s.id, s.title, s.description, s.duration_min, s.status, s.playwright, s.director,
    (SELECT file_name FROM images WHERE entity_type = 'screening' AND entity_id = s.id ORDER BY display_order LIMIT 1) AS thumbnail_url
  FROM screenings s WHERE s.type <> 'movie'`
  const params: (string | number)[] = []

  if (status) {
    sql += ' AND s.status = ?'
    params.push(status)
  }
  if (date) {
    sql += ` AND s.id IN (
      SELECT DISTINCT screening_id FROM schedules
      WHERE is_public = 1 AND DATE(CONVERT_TZ(starts_at, '+00:00', '+09:00')) = ?
    )`
    params.push(date)
  }
  sql += ' ORDER BY s.created_at DESC'

  const [rows] = await pool.execute<mysql.RowDataPacket[]>(sql, params)
  return rows as StageRow[]
}
