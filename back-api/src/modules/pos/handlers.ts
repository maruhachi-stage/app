import type { Context } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '#types.js'
import { AppError } from '#lib/errors.js'
import { successResponse } from '#utils/response.js'
import * as PosService from '#modules/pos/service.js'

const PAYMENT_METHODS = ['cash', 'card', 'qr'] as const
const IMAGE_BASE = process.env.IMAGE_BASE_URL ?? 'http://localhost:3001'

function imageUrl(path: string | null): string | undefined {
  if (!path) return undefined
  if (path.startsWith('http')) return path
  const cleanPath = path.replace(/^\/+/, '')
  return `${IMAGE_BASE}/images/${cleanPath}`
}

export const listProducts = async (c: Context<AppEnv>) => {
  const requestId = c.get('requestId')
  const rows = await PosService.listProducts()

  return c.json(successResponse({
    items: rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      category: row.category,
      price: row.price,
      imageUrl: imageUrl(row.image_url),
      stockQuantity: row.stock_quantity,
      isActive: Boolean(row.is_active),
    })),
  }, requestId))
}

export const listSales = async (c: Context<AppEnv>) => {
  const requestId = c.get('requestId')
  const limit = Math.min(Math.max(Number(c.req.query('limit') ?? 10), 1), 50)
  const rows = await PosService.listSales(limit)

  return c.json(successResponse({
    items: rows.map((row) => ({
      id: row.id,
      saleCode: row.sale_code,
      totalAmount: row.total_amount,
      paymentMethod: row.payment_method,
      createdAt: row.created_at,
    })),
  }, requestId))
}

export const createSale = async (c: Context<AppEnv>) => {
  const requestId = c.get('requestId')
  const body = await c.req.json().catch(() => {
    throw new AppError('VALIDATION_ERROR', 'Invalid JSON')
  })

  const data = z.object({
    paymentMethod: z.enum(PAYMENT_METHODS),
    items: z.array(z.object({
      productId: z.number().int().positive(),
      quantity: z.number().int().min(1).max(99),
    })).min(1).max(50),
  }).parse(body)

  const merged = Array.from(
    data.items.reduce((map, item) => {
      map.set(item.productId, (map.get(item.productId) ?? 0) + item.quantity)
      return map
    }, new Map<number, number>()),
  ).map(([productId, quantity]) => ({ productId, quantity }))

  const result = await PosService.createSale({
    paymentMethod: data.paymentMethod,
    items: merged,
  })

  return c.json(successResponse(result, requestId), 201)
}
