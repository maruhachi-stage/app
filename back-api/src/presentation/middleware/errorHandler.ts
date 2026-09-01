import type { ErrorHandler } from 'hono'
import type { AppEnv } from '#types.js'
import { ZodError } from 'zod'
import { AppError } from '#lib/errors.js'
import { errorResponse } from '#presentation/response.js'

export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
  const requestId = c.get('requestId') ?? 'unknown'

  if (err instanceof AppError) {
    return c.json(errorResponse(err.code, err.message, requestId, err.details), err.status as 400)
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      reason: issue.message,
    }))
    return c.json(
      errorResponse('VALIDATION_ERROR', 'Invalid request parameters', requestId, details),
      400,
    )
  }

  console.error('[ERROR]', err)
  return c.json(
    errorResponse('INTERNAL_SERVER_ERROR', 'An unexpected error occurred', requestId),
    500,
  )
}
