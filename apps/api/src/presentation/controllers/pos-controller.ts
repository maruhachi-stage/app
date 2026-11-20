import type { Context } from 'hono'
import { z } from 'zod'
import { AppError } from '#domain/errors/appError.js'
import type { PosService } from '#application/services/pos-service.js'
import type { AppEnv } from '#types.js'
import { successResponse } from '#presentation/response.js'

const paymentMethods = ['cash', 'card', 'qr'] as const

export class PosController {
  constructor(private readonly posService: PosService) {}
  listProducts = async (context: Context<AppEnv>) =>
    context.json(successResponse(await this.posService.listProducts(), context.get('requestId')))
  listSales = async (context: Context<AppEnv>) => {
    const limit = Math.min(Math.max(Number(context.req.query('limit') ?? 10), 1), 50)
    return context.json(
      successResponse(await this.posService.listSales(limit), context.get('requestId')),
    )
  }
  createSale = async (context: Context<AppEnv>) => {
    const body = await context.req.json().catch(() => {
      throw new AppError('VALIDATION_ERROR', 'Invalid JSON')
    })
    const data = z
      .object({
        paymentMethod: z.enum(paymentMethods),
        items: z
          .array(
            z.object({
              productId: z.number().int().positive(),
              quantity: z.number().int().min(1).max(99),
            }),
          )
          .min(1)
          .max(50),
      })
      .parse(body)
    const items = Array.from(
      data.items.reduce((map, item) => {
        map.set(item.productId, (map.get(item.productId) ?? 0) + item.quantity)
        return map
      }, new Map<number, number>()),
    ).map(([productId, quantity]) => ({ productId, quantity }))
    return context.json(
      successResponse(
        await this.posService.createSale({ paymentMethod: data.paymentMethod, items }),
        context.get('requestId'),
      ),
      201,
    )
  }
}
