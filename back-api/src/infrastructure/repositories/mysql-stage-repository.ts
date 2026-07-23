import type mysql from 'mysql2/promise'
import { mysqlPool as pool } from '#infrastructure/database/mysqlPool.js'
import type { Stage } from '#domain/entities/stage.js'
import type { StageSchedule } from '#domain/entities/stage-schedule.js'
import type { FindStagesCriteria, StageRepository } from '#domain/interfaces/repositories/stage-repository.js'

type StageRow = {
  id: number
  type: 'stage' | 'event'
  title: string
  description: string
  duration_min: number
  thumbnail_url: string | null
  status: 'now_showing' | 'coming_soon'
  playwright: string | null
  director: string | null
}

type ScheduleRow = {
  schedule_id: number
  screen_name: string
  starts_at: Date | string
  ends_at: Date | string
  remaining_seats: number
  total_seats: number
}

const toStage = (row: StageRow): Stage => ({
  id: row.id,
  type: row.type,
  title: row.title,
  description: row.description,
  durationMin: row.duration_min,
  thumbnailUrl: row.thumbnail_url,
  status: row.status,
  playwright: row.playwright,
  director: row.director,
})

const toSchedule = (row: ScheduleRow): StageSchedule => ({
  scheduleId: row.schedule_id,
  screenName: row.screen_name,
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  remainingSeats: Number(row.remaining_seats),
  totalSeats: Number(row.total_seats),
})

export class MysqlStageRepository implements StageRepository {
  async findById(stageId: number): Promise<Stage | null> {
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT s.id, s.type, s.title, s.description, s.duration_min, s.status, s.playwright, s.director,
        (SELECT file_name FROM images WHERE entity_type = 'screening' AND entity_id = s.id ORDER BY display_order LIMIT 1) AS thumbnail_url
       FROM screenings s WHERE s.id = ? AND s.type <> 'movie'`,
      [stageId],
    )
    const row = rows[0] as StageRow | undefined
    return row ? toStage(row) : null
  }

  async findSchedulesByStageId(stageId: number, date?: string): Promise<StageSchedule[]> {
    let sql = `
      SELECT sch.id as schedule_id, sc.name as screen_name, sch.starts_at, sch.ends_at, sc.total_seats,
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
    return (rows as ScheduleRow[]).map(toSchedule)
  }

  async findAll(criteria: FindStagesCriteria): Promise<Stage[]> {
    let sql = `SELECT s.id, s.type, s.title, s.description, s.duration_min, s.status, s.playwright, s.director,
      (SELECT file_name FROM images WHERE entity_type = 'screening' AND entity_id = s.id ORDER BY display_order LIMIT 1) AS thumbnail_url
    FROM screenings s WHERE `
    const params: (string | number)[] = []
    if (criteria.type) {
      sql += 's.type = ?'
      params.push(criteria.type)
    } else sql += "s.type <> 'movie'"
    if (criteria.status) {
      sql += ' AND s.status = ?'
      params.push(criteria.status)
    }
    if (criteria.date) {
      sql += ` AND s.id IN (
        SELECT DISTINCT screening_id FROM schedules
        WHERE is_public = 1 AND DATE(CONVERT_TZ(starts_at, '+00:00', '+09:00')) = ?
      )`
      params.push(criteria.date)
    }
    sql += ' ORDER BY s.created_at DESC'
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(sql, params)
    return (rows as StageRow[]).map(toStage)
  }
}
