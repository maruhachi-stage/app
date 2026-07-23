export type TicketType = 'general' | 'university' | 'highschool' | 'child'

export type Ticket = {
  type: TicketType
  label: string
  price: number
}

export const ticketCatalog: readonly Ticket[] = [
  { type: 'general', label: '一般', price: 1800 },
  { type: 'university', label: '大学生', price: 1600 },
  { type: 'highschool', label: '高校生以下', price: 1400 },
  { type: 'child', label: '幼児', price: 1000 },
]
