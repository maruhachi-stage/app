import type mysql from 'mysql2/promise'
import { pool } from '#db/client.js'
import { AppError } from '#lib/errors.js'
import type { SeatMapInfo } from '#modules/reservations/types.js'
import { defaultLayoutObjects, presentSeat, presentSeatLayout } from '#modules/reservations/seatMapPresenter.js'

export async function getSeatsForSchedule(scheduleId: number): Promise<SeatMapInfo> {
  const [schedRows] = await pool.execute<mysql.RowDataPacket[]>(
    'SELECT screen_id FROM schedules WHERE id = ? AND is_public = 1',
    [scheduleId],
  )
  if (schedRows.length === 0) throw new AppError('NOT_FOUND', 'Schedule not found')
  const screenId = schedRows[0].screen_id as number

  const [layoutRows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT id, layout_version, background_image_url, aspect_ratio_width, aspect_ratio_height
     FROM screen_seat_layouts WHERE screen_id = ?`,
    [screenId],
  )
  if (layoutRows.length === 0) throw new AppError('NOT_FOUND', 'Seat layout not found')
  const layout = layoutRows[0]

  const [seatRows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT
       s.id as seat_id, s.row_label, s.col_no,
        s.position_top_pct, s.position_left_pct,
        s.seat_width_pct, s.seat_height_pct, s.hit_radius_pct,
        CASE
          WHEN r.status = 'confirmed' THEN 'reserved'
          WHEN r.status = 'pending' THEN 'held'
          ELSE 'available'
        END as status
      FROM seats s
     LEFT JOIN reservation_seats rs ON rs.schedule_id = ? AND rs.seat_id = s.id
     LEFT JOIN reservations r ON r.id = rs.reservation_id
     AND (r.status = 'confirmed' OR (r.status = 'pending' AND r.expires_at > CURRENT_TIMESTAMP(3)))
     WHERE s.screen_id = ?
     ORDER BY s.row_label, s.col_no`,
    [scheduleId, screenId],
  )

  return {
    layout: presentSeatLayout(screenId, layout),
    objects: defaultLayoutObjects(),
    sections: [],
    seats: seatRows.map(presentSeat),
  }
}
