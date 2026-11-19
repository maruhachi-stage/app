import type { StaffOverviewDTO } from '#application/dto/staff-dto.js'
import type { StaffScreenRepository } from '#domain/interfaces/repositories/staff-screen-repository.js'

export class StaffOverviewService {
  constructor(private readonly staffScreenRepository: StaffScreenRepository) {}

  async getOverview(): Promise<StaffOverviewDTO> {
    const screens = await this.staffScreenRepository.findAll()

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
