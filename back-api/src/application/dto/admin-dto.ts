export type AdminScreenDTO = {
  id: number
  name: string
  size: 'large' | 'medium' | 'small'
  totalSeats: number
  seatCount: number
  layoutId: number | null
  layoutVersion: number | null
  aspectRatio: string | null
}

export type AdminOverviewDTO = {
  screens: {
    total: number
    seats: number
    items: AdminScreenDTO[]
  }
}
