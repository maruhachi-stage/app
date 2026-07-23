import type mysql from 'mysql2/promise'
import { pool } from '#db/client.js'
import type { MemberReservation } from '#domain/entities/member-reservation.js'
import type { MemberReservationRepository } from '#domain/interfaces/repositories/member-reservation-repository.js'
import { imageUrl } from '#utils/format.js'

export class MysqlMemberReservationRepository implements MemberReservationRepository {
  async findByMemberId(memberId: number): Promise<MemberReservation[]> {
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(`SELECT r.reservation_code, r.status, r.total_price, r.created_at, m.title as movie_title, s.title as stage_title, COALESCE(m.thumbnail_url, (SELECT file_name FROM stage_images WHERE stage_id = s.id ORDER BY display_order LIMIT 1)) as thumbnail_url, sch.starts_at, sch.ends_at, sc.name as screen_name FROM reservations r JOIN schedules sch ON sch.id = r.schedule_id LEFT JOIN movies m ON m.id = sch.movie_id LEFT JOIN stages s ON s.id = sch.stage_id JOIN screens sc ON sc.id = sch.screen_id WHERE r.member_id = ? ORDER BY r.created_at DESC`, [memberId])
    return rows.map(row => ({ reservationCode: row.reservation_code as string, status: row.status as string, totalPrice: row.total_price as number, createdAt: row.created_at as Date | string, movieTitle: (row.movie_title ?? row.stage_title) as string, thumbnailUrl: imageUrl(row.thumbnail_url as string | null), startsAt: row.starts_at as Date | string, endsAt: row.ends_at as Date | string, screenName: row.screen_name as string }))
  }
}
