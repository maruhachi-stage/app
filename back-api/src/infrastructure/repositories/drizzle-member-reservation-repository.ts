import { desc, eq, sql } from 'drizzle-orm'
import { db } from '#infrastructure/database/mysqlPool.js'
import { images, reservations, schedules, screens, screenings } from '#infrastructure/database/schema.js'
import type { MemberReservation } from '#domain/entities/member-reservation.js'
import type { MemberReservationRepository } from '#domain/interfaces/repositories/member-reservation-repository.js'
import { imageUrl } from '#lib/format.js'

const screeningThumbnail = sql<string | null>`(
  SELECT ${images.fileName}
  FROM ${images}
  WHERE ${images.entityType} = 'screening'
    AND ${images.entityId} = ${screenings.id}
  ORDER BY ${images.displayOrder}
  LIMIT 1
)`

export class DrizzleMemberReservationRepository implements MemberReservationRepository {
  async findByMemberId(memberId: number): Promise<MemberReservation[]> {
    const rows = await db.select({
      reservationCode: reservations.reservationCode,
      status: reservations.status,
      totalPrice: reservations.totalPrice,
      createdAt: reservations.createdAt,
      title: screenings.title,
      thumbnailUrl: screeningThumbnail,
      startsAt: schedules.startsAt,
      endsAt: schedules.endsAt,
      screenName: screens.name,
    })
      .from(reservations)
      .innerJoin(schedules, eq(schedules.id, reservations.scheduleId))
      .innerJoin(screenings, eq(screenings.id, schedules.screeningId))
      .innerJoin(screens, eq(screens.id, schedules.screenId))
      .where(eq(reservations.memberId, memberId))
      .orderBy(desc(reservations.createdAt))

    return rows.map((row) => ({
      reservationCode: row.reservationCode,
      status: row.status,
      totalPrice: row.totalPrice,
      createdAt: row.createdAt,
      movieTitle: row.title,
      thumbnailUrl: imageUrl(row.thumbnailUrl),
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      screenName: row.screenName,
    }))
  }
}
