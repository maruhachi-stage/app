export type StaffScreen = {
  id: number
  name: string
  size: "large" | "medium" | "small"
  totalSeats: number
  seatCount: number
  layoutId: number | null
  layoutVersion: number | null
  aspectRatio: string | null
}

export type StaffOverview = {
  screens: {
    total: number
    seats: number
    items: StaffScreen[]
  }
}
