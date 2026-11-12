import { asc, count, eq } from 'drizzle-orm'
import { db } from '#infrastructure/database/sqlite.js'
import { screenSeatLayouts, screens, seats } from '#infrastructure/database/schema.js'
import type { StaffScreen } from '#domain/entities/staff-screen.js'
import type { StaffScreenRepository } from '#domain/interfaces/repositories/staff-screen-repository.js'

type StaffScreenRow = {
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

const toStaffScreen = (row: StaffScreenRow): StaffScreen => ({
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

export class DrizzleStaffScreenRepository implements StaffScreenRepository {
  async findAll(): Promise<StaffScreen[]> {
    const rows = await db
      .select({
        id: screens.id,
        name: screens.name,
        size: screens.size,
        totalSeats: screens.totalSeats,
        layoutId: screenSeatLayouts.id,
        layoutVersion: screenSeatLayouts.layoutVersion,
        aspectRatioWidth: screenSeatLayouts.aspectRatioWidth,
        aspectRatioHeight: screenSeatLayouts.aspectRatioHeight,
        seatCount: count(seats.id),
      })
      .from(screens)
      .leftJoin(screenSeatLayouts, eq(screenSeatLayouts.screenId, screens.id))
      .leftJoin(seats, eq(seats.seatLayoutId, screenSeatLayouts.id))
      .groupBy(
        screens.id,
        screens.name,
        screens.size,
        screens.totalSeats,
        screenSeatLayouts.id,
        screenSeatLayouts.layoutVersion,
        screenSeatLayouts.aspectRatioWidth,
        screenSeatLayouts.aspectRatioHeight,
      )
      .orderBy(asc(screens.id))
    return rows.map(toStaffScreen)
  }
}
