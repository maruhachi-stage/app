import type mysql from 'mysql2/promise'
import { pool } from '#db/client.js'

export type AdminScreenRow = {
  id: number
  name: string
  size: 'large' | 'medium' | 'small'
  total_seats: number
  layout_id: number | null
  layout_version: number | null
  aspect_ratio_width: number | null
  aspect_ratio_height: number | null
  seat_count: number
}

export async function getAdminScreens(): Promise<AdminScreenRow[]> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT
       sc.id,
       sc.name,
       sc.size,
       sc.total_seats,
       l.id AS layout_id,
       l.layout_version,
       l.aspect_ratio_width,
       l.aspect_ratio_height,
       COUNT(se.id) AS seat_count
     FROM screens sc
     LEFT JOIN screen_seat_layouts l ON l.screen_id = sc.id
     LEFT JOIN seats se ON se.seat_layout_id = l.id
     GROUP BY sc.id, sc.name, sc.size, sc.total_seats, l.id, l.layout_version, l.aspect_ratio_width, l.aspect_ratio_height
     ORDER BY sc.id ASC`,
  )

  return rows as AdminScreenRow[]
}
