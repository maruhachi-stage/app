import type { ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { AppEnv } from '#types.js'
import { ZodError } from 'zod'
import { AppError } from '#lib/errors.js'
import { errorResponse } from '#presentation/response.js'

export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
  const requestId = c.get('requestId') ?? 'unknown'

  if (err instanceof AppError) {
    return c.json(errorResponse(err.code, err.message, requestId, err.details), err.status as 400)
  }

  // Middleware such as CSRF already carries its own status, which must not be
  // turned into an internal error response.
  if (err instanceof HTTPException) {
    return c.json(
      errorResponse(
        err.status === 403 ? 'FORBIDDEN' : 'REQUEST_ERROR',
        err.message || 'Request rejected',
        requestId,
      ),
      err.status,
    )
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
