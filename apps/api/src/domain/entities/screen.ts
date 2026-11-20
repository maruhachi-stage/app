export type Screen = {
  id: number
  name: string
  size: 'large' | 'medium' | 'small'
  totalSeats: number
  backgroundImageUrl: string | null
  aspectRatioWidth: number | null
  aspectRatioHeight: number | null
}
