import type { AdminOverviewDTO } from '#application/dto/admin-dto.js'
import type { AdminScreenRepository } from '#domain/interfaces/repositories/admin-screen-repository.js'

export class AdminOverviewService {
  constructor(private readonly adminScreenRepository: AdminScreenRepository) {}

  async getOverview(): Promise<AdminOverviewDTO> {
    const screens = await this.adminScreenRepository.findAll()

    return {
      screens: {
        total: screens.length,
        seats: screens.reduce((sum, screen) => sum + screen.totalSeats, 0),
        items: screens.map((screen) => ({
          id: screen.id,
          name: screen.name,
          size: screen.size,
          totalSeats: screen.totalSeats,
          seatCount: screen.seatCount,
          layoutId: screen.layoutId,
          layoutVersion: screen.layoutVersion,
          aspectRatio:
            screen.aspectRatioWidth && screen.aspectRatioHeight
              ? `${screen.aspectRatioWidth}/${screen.aspectRatioHeight}`
              : null,
        })),
      },
    }
  }
}
