import type mysql from 'mysql2/promise'
import { pool } from '#db/client.js'

export type ScreenRow = {
  id: number
  name: string
  size: 'large' | 'medium' | 'small'
  total_seats: number
  background_image_url: string | null
  aspect_ratio_width: number | null
  aspect_ratio_height: number | null
}

export async function getScreens(): Promise<ScreenRow[]> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT 
      s.id, 
      s.name, 
      s.size, 
      s.total_seats, 
      l.background_image_url, 
      l.aspect_ratio_width, 
      l.aspect_ratio_height
    FROM screens s
    LEFT JOIN screen_seat_layouts l ON s.id = l.screen_id
    ORDER BY s.id ASC`
  )
  return rows as ScreenRow[]
}

export async function getScreenById(screenId: number): Promise<ScreenRow | null> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT 
      s.id, 
      s.name, 
      s.size, 
      s.total_seats, 
      l.background_image_url, 
      l.aspect_ratio_width, 
      l.aspect_ratio_height
    FROM screens s
    LEFT JOIN screen_seat_layouts l ON s.id = l.screen_id
    WHERE s.id = ?`,
    [screenId]
  )
  return (rows[0] as ScreenRow) || null
}
