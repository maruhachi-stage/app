import type { ConfigDTO } from '#application/dto/config-dto.js'
import { ticketCatalog } from '#domain/entities/ticket.js'

export class ConfigService {
  getConfig(): ConfigDTO {
    return { tickets: ticketCatalog.map((ticket) => ({ ...ticket })) }
  }
}
