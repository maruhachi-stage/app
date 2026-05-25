import type { Context } from 'hono'
import type { AppEnv } from '#types.js'
import { successResponse } from '#utils/response.js'
import { TICKET_PRICES, TICKET_LABELS } from '#config/constants.js'

export const getConfig = async (c: Context<AppEnv>) => {
  const requestId = c.get('requestId')
  const ticketTypes = Object.keys(TICKET_PRICES).map((key) => {
    const type = key as keyof typeof TICKET_PRICES
    return {
      type,
      label: TICKET_LABELS[type],
      price: TICKET_PRICES[type],
    }
  })

  return c.json(
    successResponse(
      {
        tickets: ticketTypes,
      },
      requestId
    )
  )
}
