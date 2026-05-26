export type ProductCategory = "goods" | "food" | "drink" | "set"

export type ProductOption = {
  id: string
  label: string
  priceDelta?: number
}

export type ProductOptionGroup = {
  id: string
  name: string
  required?: boolean
  options: ProductOption[]
}

export type Product = {
  id: string
  name: string
  category: ProductCategory
  price: number
  description?: string
  imageUrl?: string
  movieTitle?: string
  isNew?: boolean
  isSoldOut?: boolean
  optionGroups?: ProductOptionGroup[]
  notes?: string[]
}

export type SelectedProductOption = {
  groupId: string
  groupName: string
  optionId: string
  label: string
  priceDelta: number
}

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  goods: "映画グッズ",
  food: "フード",
  drink: "ドリンク",
  set: "セット",
}

export function formatProductPrice(price: number): string {
  return `¥${price.toLocaleString("ja-JP")}`
}

export function buildConfiguredProductId(
  productId: string,
  selections: SelectedProductOption[],
): string {
  if (selections.length === 0) return productId
  const optionKey = selections
    .map((selection) => `${selection.groupId}:${selection.optionId}`)
    .sort()
    .join("|")
  return `${productId}__${optionKey}`
}

export function getConfiguredPrice(
  product: Product,
  selections: SelectedProductOption[],
): number {
  return product.price + selections.reduce((sum, selection) => sum + selection.priceDelta, 0)
}
