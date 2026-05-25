import type mysql from 'mysql2/promise'
import { pool } from '#db/client.js'
import { imageUrl } from '#utils/format.js'

export type MemberProfile = { id: number; email: string; name: string | null }

export type ReservationListItem = {
  reservationCode: string
  status: string
  totalPrice: number
  createdAt: Date | string
  movieTitle: string
  thumbnailUrl: string | null
  startsAt: Date | string
  endsAt: Date | string
  screenName: string
}

export async function findMemberByEmail(email: string): Promise<{ id: number; email: string } | null> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    'SELECT id, email FROM members WHERE email = ?',
    [email],
  )
  return rows.length > 0 ? (rows[0] as { id: number; email: string }) : null
}

export async function createMember(email: string): Promise<{ id: number; email: string }> {
  const [result] = await pool.execute<mysql.ResultSetHeader>(
    'INSERT INTO members (email) VALUES (?)',
    [email],
  )
  return { id: result.insertId, email }
}

export async function getMemberProfile(memberId: number): Promise<MemberProfile | null> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    'SELECT id, email, name FROM members WHERE id = ?',
    [memberId],
  )
  return rows.length > 0 ? (rows[0] as MemberProfile) : null
}

export async function getMemberReservations(memberId: number): Promise<ReservationListItem[]> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT r.reservation_code, r.status, r.total_price, r.created_at,
            m.title as movie_title, m.thumbnail_url,
            sch.starts_at, sch.ends_at, sc.name as screen_name
     FROM reservations r
     JOIN schedules sch ON sch.id = r.schedule_id
     JOIN movies m ON m.id = sch.movie_id
     JOIN screens sc ON sc.id = sch.screen_id
     WHERE r.member_id = ?
     ORDER BY r.created_at DESC`,
    [memberId],
  )
  return rows.map(r => ({
    reservationCode: r.reservation_code as string,
    status: r.status as string,
    totalPrice: r.total_price as number,
    createdAt: r.created_at,
    movieTitle: r.movie_title as string,
    thumbnailUrl: imageUrl(r.thumbnail_url as string | null),
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    screenName: r.screen_name as string,
  }))
}
