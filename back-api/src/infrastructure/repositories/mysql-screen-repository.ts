import { asc, eq } from 'drizzle-orm'
import { db } from '#infrastructure/database/mysqlPool.js'
import { screenSeatLayouts, screens } from '#infrastructure/database/schema.js'
import type { Screen } from '#domain/entities/screen.js'
import type { ScreenRepository } from '#domain/interfaces/repositories/screen-repository.js'

type ScreenRow = { id: number; name: string; size: 'large' | 'medium' | 'small'; totalSeats: number; backgroundImageUrl: string | null; aspectRatioWidth: number | null; aspectRatioHeight: number | null }

const toScreen = (row: ScreenRow): Screen => ({
  id: row.id,
  name: row.name,
  size: row.size,
  totalSeats: row.totalSeats,
  backgroundImageUrl: row.backgroundImageUrl,
  aspectRatioWidth: row.aspectRatioWidth,
  aspectRatioHeight: row.aspectRatioHeight,
})

export class MysqlScreenRepository implements ScreenRepository {
  async findAll(): Promise<Screen[]> {
    const rows = await this.baseQuery().orderBy(asc(screens.id))
    return rows.map(toScreen)
  }

  async findById(screenId: number): Promise<Screen | null> {
    const [row] = await this.baseQuery().where(eq(screens.id, screenId))
    return row ? toScreen(row) : null
  }
  private baseQuery() {
    return db.select({ id: screens.id, name: screens.name, size: screens.size, totalSeats: screens.totalSeats, backgroundImageUrl: screenSeatLayouts.backgroundImageUrl, aspectRatioWidth: screenSeatLayouts.aspectRatioWidth, aspectRatioHeight: screenSeatLayouts.aspectRatioHeight })
      .from(screens)
      .leftJoin(screenSeatLayouts, eq(screens.id, screenSeatLayouts.screenId))
  }
}
