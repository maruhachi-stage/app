import type mysql from 'mysql2/promise'
import { pool } from '#db/client.js'
import { AppError } from '#lib/errors.js'
import { generateReservationCode, getQrCodeUrl, maskEmail, imageUrl } from '#utils/format.js'
import { RESERVATION_CONFIG, TICKET_PRICES, type TicketType } from '#config/constants.js'

export type SeatLayout = {
  screenId: number
  layoutVersion: number
  backgroundImageUrl: string
  aspectRatio: string
}

export type SeatInfo = {
  seatId: number
  row: string
  col: number
  positionTopPct: number
  positionLeftPct: number
  seatWidthPct: number
  seatHeightPct: number
  hitRadiusPct: number | null
  status: 'available' | 'reserved'
}

export type ReservationForCancel = {
  id: number
  memberId: number | null
  bookingType: string
  customerEmail: string
  status: string
  startsAt: Date | string
}

async function validateSeatsForSchedule(
  scheduleId: number,
  seatIds: number[],
): Promise<void> {
  const [scheduleRows] = await pool.execute<mysql.RowDataPacket[]>(
    'SELECT screen_id FROM schedules WHERE id = ? AND is_public = 1',
    [scheduleId],
  )
  if (scheduleRows.length === 0) {
    throw new AppError('NOT_FOUND', 'Schedule not found')
  }
  const screenId = scheduleRows[0].screen_id as number

  const placeholders = seatIds.map(() => '?').join(',')
  const [seatRows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT id FROM seats WHERE screen_id = ? AND id IN (${placeholders})`,
    [screenId, ...seatIds],
  )
  if (seatRows.length !== seatIds.length) {
    throw new AppError('VALIDATION_ERROR', 'One or more invalid seat IDs')
  }
}

export async function getSeatsForSchedule(scheduleId: number): Promise<{ layout: SeatLayout; seats: SeatInfo[] }> {
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
          WHEN r.id IS NOT NULL THEN 'reserved'
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
    layout: {
      screenId,
      layoutVersion: layout.layout_version as number,
      backgroundImageUrl: layout.background_image_url as string,
      aspectRatio: `${layout.aspect_ratio_width}/${layout.aspect_ratio_height}`,
    },
    seats: seatRows.map(r => ({
      seatId: r.seat_id as number,
      row: r.row_label as string,
      col: r.col_no as number,
      positionTopPct: Number(r.position_top_pct),
      positionLeftPct: Number(r.position_left_pct),
      seatWidthPct: Number(r.seat_width_pct),
      seatHeightPct: Number(r.seat_height_pct),
      hitRadiusPct: r.hit_radius_pct != null ? Number(r.hit_radius_pct) : null,
      status: r.status as 'available' | 'reserved',
    })),
  }
}

export async function getReservationDetail(code: string) {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT r.id, r.reservation_code, r.status, r.member_id, r.booking_type,
            r.customer_name, r.customer_email, r.total_price,
            m.title as movie_title, m.thumbnail_url,
            sch.starts_at, sch.ends_at,
            sc.name as screen_name
     FROM reservations r
     JOIN schedules sch ON sch.id = r.schedule_id
     JOIN movies m ON m.id = sch.movie_id
     JOIN screens sc ON sc.id = sch.screen_id
     WHERE r.reservation_code = ?`,
    [code],
  )
  if (rows.length === 0) return null

  const r = rows[0]
  const [seatRows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT s.row_label, s.col_no, rs.ticket_type, rs.price
     FROM reservation_seats rs
     JOIN seats s ON s.id = rs.seat_id
     WHERE rs.reservation_id = ?
     ORDER BY s.row_label, s.col_no`,
    [r.id],
  )

  const startsAt = new Date(r.starts_at as string)
  const canCancel = r.status === 'confirmed' && (startsAt.getTime() - Date.now()) > 30 * 60 * 1000

  return {
    reservationCode: r.reservation_code as string,
    status: r.status as string,
    bookingType: r.booking_type as 'member' | 'guest',
    canCancel,
    movie: { title: r.movie_title as string, thumbnailUrl: imageUrl(r.thumbnail_url as string | null) },
    schedule: { startsAt: r.starts_at, endsAt: r.ends_at, screenName: r.screen_name as string },
    seats: seatRows.map(s => ({
      row: s.row_label as string,
      col: s.col_no as number,
      ticketType: s.ticket_type as string,
      price: s.price as number,
    })),
    totalPrice: r.total_price as number,
    customer: { maskedEmail: maskEmail(r.customer_email as string) },
    qrCodeUrl: r.status === 'confirmed' ? getQrCodeUrl(r.reservation_code as string) : null,
  }
}

export async function getReservationForCancel(code: string): Promise<ReservationForCancel | null> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT r.id, r.member_id, r.booking_type, r.customer_email, r.status, sch.starts_at
     FROM reservations r JOIN schedules sch ON sch.id = r.schedule_id
     WHERE r.reservation_code = ?`,
    [code],
  )
  if (rows.length === 0) return null
  const r = rows[0]
  return {
    id: r.id as number,
    memberId: r.member_id as number | null,
    bookingType: r.booking_type as string,
    customerEmail: r.customer_email as string,
    status: r.status as string,
    startsAt: r.starts_at,
  }
}

export async function cancelReservation(reservationId: number): Promise<void> {
  await pool.execute('UPDATE reservations SET status = ? WHERE id = ?', ['cancelled', reservationId])
}

export async function checkLayoutVersion(screenId: number, layoutVersion: number): Promise<void> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    'SELECT layout_version FROM screen_seat_layouts WHERE screen_id = ?',
    [screenId],
  )
  if (rows.length === 0 || rows[0].layout_version !== layoutVersion) {
    throw new AppError('SEAT_LAYOUT_VERSION_MISMATCH', 'Seat layout has been updated')
  }
}

export async function getSeatsInScreen(
  seatIds: number[],
  screenId: number,
): Promise<Map<number, { row_label: string; col_no: number }>> {
  const placeholders = seatIds.map(() => '?').join(',')
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT id, row_label, col_no FROM seats WHERE id IN (${placeholders}) AND screen_id = ?`,
    [...seatIds, screenId],
  )
  if (rows.length !== seatIds.length) {
    throw new AppError('VALIDATION_ERROR', 'One or more invalid seat IDs')
  }
  return new Map(rows.map(s => [s.id as number, s as { row_label: string; col_no: number }]))
}

export async function holdSeats(
  scheduleId: number,
  seatIds: number[],
): Promise<{ reservationCode: string; expiresAt: Date }> {
  await validateSeatsForSchedule(scheduleId, seatIds)

  let reservationCode = ''
  for (let i = 0; i < 5; i++) {
    const candidate = generateReservationCode()
    const [existing] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT id FROM reservations WHERE reservation_code = ?',
      [candidate],
    )
    if (existing.length === 0) { reservationCode = candidate; break }
  }
  if (!reservationCode) throw new AppError('INTERNAL_SERVER_ERROR', 'Failed to generate reservation code')

  const expiresAt = new Date(Date.now() + RESERVATION_CONFIG.HOLD_EXPIRES_MIN * 60 * 1000)
  const placeholders = seatIds.map(() => '?').join(',')

  const conn = await pool.getConnection()
  await conn.beginTransaction()
  try {
    await conn.execute(
      `DELETE rs FROM reservation_seats rs
       JOIN reservations r ON r.id = rs.reservation_id
       WHERE rs.schedule_id = ? AND rs.seat_id IN (${placeholders})
       AND r.status = 'pending' AND r.expires_at <= CURRENT_TIMESTAMP(3)`,
      [scheduleId, ...seatIds],
    )

    const [conflicts] = await conn.execute<mysql.RowDataPacket[]>(
      `SELECT rs.seat_id FROM reservation_seats rs
       JOIN reservations r ON r.id = rs.reservation_id
       WHERE rs.schedule_id = ? AND rs.seat_id IN (${placeholders})
       AND (r.status = 'confirmed' OR (r.status = 'pending' AND r.expires_at > CURRENT_TIMESTAMP(3)))
       FOR UPDATE`,
      [scheduleId, ...seatIds],
    )
    if (conflicts.length > 0) {
      throw new AppError('SEAT_ALREADY_RESERVED', 'One or more seats are already reserved or held')
    }

    const [resResult] = await conn.execute<mysql.ResultSetHeader>(
      `INSERT INTO reservations (reservation_code, schedule_id, status, expires_at, total_price)
       VALUES (?, ?, 'pending', ?, 0)`,
      [reservationCode, scheduleId, expiresAt],
    )
    const reservationId = resResult.insertId

    for (const seatId of seatIds) {
      await conn.execute(
        `INSERT INTO reservation_seats (reservation_id, schedule_id, seat_id, ticket_type, price)
         VALUES (?, ?, ?, 'general', 0)`,
        [reservationId, scheduleId, seatId],
      )
    }

    await conn.commit()
    return { reservationCode, expiresAt }
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

export async function finalizeReservation(params: {
  reservationCode?: string
  scheduleId: number
  memberId: number | null
  bookingType: 'member' | 'guest'
  customer: { email: string }
  tickets: { seatId: number; ticketType: TicketType }[]
}): Promise<{ reservationId: number; reservationCode: string; totalPrice: number }> {
  const { reservationCode, scheduleId, memberId, bookingType, customer, tickets } = params
  const seatIds = tickets.map(t => t.seatId)
  const totalPrice = tickets.reduce((sum, t) => sum + TICKET_PRICES[t.ticketType], 0)
  const placeholders = seatIds.map(() => '?').join(',')

  const conn = await pool.getConnection()
  await conn.beginTransaction()
  let reservationId: number
  let finalReservationCode = reservationCode || ''

  try {
    const [conflicts] = await conn.execute<mysql.RowDataPacket[]>(
      `SELECT rs.seat_id FROM reservation_seats rs
       JOIN reservations r ON r.id = rs.reservation_id
       WHERE rs.schedule_id = ? AND rs.seat_id IN (${placeholders})
       AND (r.status = 'confirmed' OR (r.status = 'pending' AND r.expires_at > CURRENT_TIMESTAMP(3)))
       ${reservationCode ? 'AND r.reservation_code <> ?' : ''}
       FOR UPDATE`,
      reservationCode ? [scheduleId, ...seatIds, reservationCode] : [scheduleId, ...seatIds],
    )
    if (conflicts.length > 0) {
      throw new AppError('SEAT_ALREADY_RESERVED', 'One or more seats are already reserved or held')
    }

    if (reservationCode) {
      const [resRows] = await conn.execute<mysql.RowDataPacket[]>(
        `SELECT id FROM reservations
         WHERE reservation_code = ? AND status = 'pending' AND schedule_id = ?
         FOR UPDATE`,
        [reservationCode, scheduleId],
      )
      if (resRows.length === 0) throw new AppError('NOT_FOUND', 'Valid tentative reservation not found')
      reservationId = resRows[0].id as number

      await conn.execute(
        `UPDATE reservations
         SET status = 'confirmed', expires_at = NULL, member_id = ?,
             booking_type = ?, customer_name = NULL, customer_email = ?, total_price = ?
         WHERE id = ?`,
        [memberId, bookingType, customer.email, totalPrice, reservationId],
      )
      await conn.execute('DELETE FROM reservation_seats WHERE reservation_id = ?', [reservationId])
    } else {
      for (let i = 0; i < 5; i++) {
        const candidate = generateReservationCode()
        const [existing] = await conn.execute<mysql.RowDataPacket[]>(
          'SELECT id FROM reservations WHERE reservation_code = ?',
          [candidate],
        )
        if (existing.length === 0) { finalReservationCode = candidate; break }
      }
      if (!finalReservationCode) throw new AppError('INTERNAL_SERVER_ERROR', 'Failed to generate reservation code')

      const [resResult] = await conn.execute<mysql.ResultSetHeader>(
        `INSERT INTO reservations
           (reservation_code, schedule_id, member_id, booking_type, customer_name, customer_email, total_price)
         VALUES (?, ?, ?, ?, NULL, ?, ?)`,
        [finalReservationCode, scheduleId, memberId, bookingType, customer.email, totalPrice],
      )
      reservationId = resResult.insertId
    }

    for (const ticket of tickets) {
      await conn.execute(
        `INSERT INTO reservation_seats (reservation_id, schedule_id, seat_id, ticket_type, price)
         VALUES (?, ?, ?, ?, ?)`,
        [reservationId, scheduleId, ticket.seatId, ticket.ticketType, TICKET_PRICES[ticket.ticketType]],
      )
    }

    await conn.commit()
    return { reservationId, reservationCode: finalReservationCode, totalPrice }
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}
