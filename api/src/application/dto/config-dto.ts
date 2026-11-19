import type { TicketType } from '#domain/entities/ticket.js'

export type TicketTypeDTO = {
  type: TicketType
  label: string
  price: number
}

export type ConfigDTO = {
  tickets: TicketTypeDTO[]
}
