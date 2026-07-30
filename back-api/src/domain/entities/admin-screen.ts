export type AdminScreen = {
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
