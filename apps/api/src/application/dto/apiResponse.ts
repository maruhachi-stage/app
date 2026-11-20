export type SuccessResponseDTO<T> = {
  data: T
  meta: { requestId: string }
}

export type ErrorResponseDTO = {
  error: { code: string; message: string; details?: unknown }
  meta: { requestId: string }
}
