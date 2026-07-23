import type mysql from 'mysql2/promise'
import { mysqlPool as pool } from '#infrastructure/database/mysqlPool.js'
import type { Screen } from '#domain/entities/screen.js'
import type { ScreenRepository } from '#domain/interfaces/repositories/screen-repository.js'

type ScreenRow = {
  id: number
  name: string
  size: 'large' | 'medium' | 'small'
  total_seats: number
  background_image_url: string | null
  aspect_ratio_width: number | null
  aspect_ratio_height: number | null
}

const toScreen = (row: ScreenRow): Screen => ({
  id: row.id,
  name: row.name,
  size: row.size,
  totalSeats: row.total_seats,
  backgroundImageUrl: row.background_image_url,
  aspectRatioWidth: row.aspect_ratio_width,
  aspectRatioHeight: row.aspect_ratio_height,
})

export class MysqlScreenRepository implements ScreenRepository {
  async findAll(): Promise<Screen[]> {
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(`
      SELECT s.id, s.name, s.size, s.total_seats, l.background_image_url,
        l.aspect_ratio_width, l.aspect_ratio_height
      FROM screens s
      LEFT JOIN screen_seat_layouts l ON s.id = l.screen_id
      ORDER BY s.id ASC`)
    return (rows as ScreenRow[]).map(toScreen)
  }

  async findById(screenId: number): Promise<Screen | null> {
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(`
      SELECT s.id, s.name, s.size, s.total_seats, l.background_image_url,
        l.aspect_ratio_width, l.aspect_ratio_height
      FROM screens s
      LEFT JOIN screen_seat_layouts l ON s.id = l.screen_id
      WHERE s.id = ?`, [screenId])
    const row = rows[0] as ScreenRow | undefined
    return row ? toScreen(row) : null
  }
}
