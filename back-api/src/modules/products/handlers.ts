import type { Context } from 'hono'
import type { AppEnv } from '#types.js'
import { AppError } from '#lib/errors.js'
import { successResponse } from '#utils/response.js'
import * as ProductService from '#modules/products/service.js'
import type { ProductCategory, ProductRow } from '#modules/products/service.js'

const CATEGORIES = ['goods', 'food', 'drink', 'set'] as const
const IMAGE_BASE = process.env.IMAGE_BASE_URL ?? 'http://localhost:3001'

function imageUrl(path: string | null): string | undefined {
  if (!path) return undefined
  if (path.startsWith('http')) return path
  const cleanPath = path.replace(/^\/+/, '')
  return `${IMAGE_BASE}/images/${cleanPath}`
}

type ProductResponse = {
  id: string
  name: string
  category: ProductCategory
  price: number
  description?: string
  imageUrl?: string
  movieTitle?: string
  isNew?: boolean
  isSoldOut?: boolean
  optionGroups?: Array<{
    id: string
    name: string
    required?: boolean
    options: Array<{ id: string; label: string; priceDelta?: number }>
  }>
  notes?: string[]
}

export const listProducts = async (c: Context<AppEnv>) => {
  const requestId = c.get('requestId')
  const category = c.req.query('category')

  if (category && !CATEGORIES.includes(category as ProductCategory)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid product category')
  }

  const products = await ProductService.getProducts(category as ProductCategory | undefined)
  const items = await hydrateProducts(products)
  return c.json(successResponse({ items }, requestId))
}

export const getProduct = async (c: Context<AppEnv>) => {
  const requestId = c.get('requestId')
  const productId = c.req.param('productId')
  if (!productId) throw new AppError('VALIDATION_ERROR', 'Product id is required')
  const product = await ProductService.getProductById(productId)
  if (!product) throw new AppError('NOT_FOUND', 'Product not found')

  const [item] = await hydrateProducts([product])
  return c.json(successResponse(item, requestId))
}

async function hydrateProducts(products: ProductRow[]): Promise<ProductResponse[]> {
  const productIds = products.map((product) => product.id)
  const groups = await ProductService.getOptionGroups(productIds)
  const options = await ProductService.getOptions(groups.map((group) => group.id))
  const notes = await ProductService.getNotes(productIds)

  const optionsByGroup = new Map<number, Array<{ id: string; label: string; priceDelta?: number }>>()
  for (const option of options) {
    const current = optionsByGroup.get(option.group_id) ?? []
    current.push({
      id: option.option_key,
      label: option.label,
      ...(option.price_delta ? { priceDelta: option.price_delta } : {}),
    })
    optionsByGroup.set(option.group_id, current)
  }

  const groupsByProduct = new Map<string, ProductResponse['optionGroups']>()
  for (const group of groups) {
    const current = groupsByProduct.get(group.product_id) ?? []
    current.push({
      id: group.group_key,
      name: group.name,
      ...(group.required ? { required: true } : {}),
      options: optionsByGroup.get(group.id) ?? [],
    })
    groupsByProduct.set(group.product_id, current)
  }

  const notesByProduct = new Map<string, string[]>()
  for (const note of notes) {
    const current = notesByProduct.get(note.product_id) ?? []
    current.push(note.note)
    notesByProduct.set(note.product_id, current)
  }

  return products.map((product) => {
    const resolvedImageUrl = imageUrl(product.image_url)
    return {
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      ...(product.description ? { description: product.description } : {}),
      ...(resolvedImageUrl ? { imageUrl: resolvedImageUrl } : {}),
      ...(product.movie_title ? { movieTitle: product.movie_title } : {}),
      ...(product.is_new ? { isNew: true } : {}),
      ...(product.is_sold_out ? { isSoldOut: true } : {}),
      ...(groupsByProduct.get(product.id)?.length
        ? { optionGroups: groupsByProduct.get(product.id) }
        : {}),
      ...(notesByProduct.get(product.id)?.length ? { notes: notesByProduct.get(product.id) } : {}),
    }
  })
}
