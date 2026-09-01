export type ProductCategory = 'goods' | 'food' | 'drink' | 'set'

export type ProductOption = { id: string; label: string; priceDelta: number }
export type ProductOptionGroup = {
  id: string
  name: string
  required: boolean
  options: ProductOption[]
}

export type Product = {
  id: string
  name: string
  category: ProductCategory
  price: number
  description: string | null
  imagePath: string | null
  movieTitle: string | null
  isNew: boolean
  isSoldOut: boolean
  optionGroups: ProductOptionGroup[]
  notes: string[]
}
