import type { ErrorCodeKey } from '#domain/errors/appError.js'

export class ReservationError extends Error {
  constructor(readonly code: ErrorCodeKey, message: string) {
    super(message)
    this.name = 'ReservationError'
  }
}
