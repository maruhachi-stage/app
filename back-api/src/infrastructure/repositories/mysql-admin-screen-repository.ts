import { asc, count, eq } from 'drizzle-orm'
import { db } from '#infrastructure/database/mysqlPool.js'
import { screenSeatLayouts, screens, seats } from '#infrastructure/database/schema.js'
import type { AdminScreen } from '#domain/entities/admin-screen.js'
import type { AdminScreenRepository } from '#domain/interfaces/repositories/admin-screen-repository.js'

type AdminScreenRow = {
  id: number
  name: string
  size: 'large' | 'medium' | 'small'
  totalSeats: number
  layoutId: number | null
  layoutVersion: number | null
  aspectRatioWidth: number | null
  aspectRatioHeight: number | null
  seatCount: number
}

const toAdminScreen = (row: AdminScreenRow): AdminScreen => ({
  id: row.id,
  name: row.name,
  size: row.size,
  totalSeats: Number(row.totalSeats),
  layoutId: row.layoutId,
  layoutVersion: row.layoutVersion,
  aspectRatioWidth: row.aspectRatioWidth,
  aspectRatioHeight: row.aspectRatioHeight,
  seatCount: Number(row.seatCount),
})

export class MysqlAdminScreenRepository implements AdminScreenRepository {
  async findAll(): Promise<AdminScreen[]> {
    const rows = await db.select({ id: screens.id, name: screens.name, size: screens.size, totalSeats: screens.totalSeats, layoutId: screenSeatLayouts.id, layoutVersion: screenSeatLayouts.layoutVersion, aspectRatioWidth: screenSeatLayouts.aspectRatioWidth, aspectRatioHeight: screenSeatLayouts.aspectRatioHeight, seatCount: count(seats.id) })
      .from(screens)
      .leftJoin(screenSeatLayouts, eq(screenSeatLayouts.screenId, screens.id))
      .leftJoin(seats, eq(seats.seatLayoutId, screenSeatLayouts.id))
      .groupBy(screens.id, screens.name, screens.size, screens.totalSeats, screenSeatLayouts.id, screenSeatLayouts.layoutVersion, screenSeatLayouts.aspectRatioWidth, screenSeatLayouts.aspectRatioHeight)
      .orderBy(asc(screens.id))
    return rows.map(toAdminScreen)
  }
}
