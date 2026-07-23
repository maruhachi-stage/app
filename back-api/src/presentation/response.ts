export function successResponse<T>(data: T, requestId: string) {
  return { data, meta: { requestId } } as const
}

export function errorResponse(
  code: string,
  message: string,
  requestId: string,
  details?: unknown,
) {
  return {
    error: { code, message, ...(details !== undefined ? { details } : {}) },
    meta: { requestId },
  } as const
}
