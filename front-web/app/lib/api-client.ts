type ApiResponse<T> = { data: T; meta: { requestId: string } }
type ApiErrorBody = {
  error: { code: string; message: string; details?: unknown }
  meta: { requestId: string }
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
    public readonly status?: number,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (!value || typeof value !== "object") return false
  const record = value as Record<string, unknown>
  const error = record.error as Record<string, unknown> | undefined
  return !!error && typeof error.code === "string" && typeof error.message === "string"
}

function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  if (!value || typeof value !== "object") return false
  return "data" in (value as Record<string, unknown>)
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const defaultHeaders: Record<string, string> = {}
  if (options?.body !== undefined) {
    defaultHeaders["Content-Type"] = "application/json"
  }

  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options?.headers,
    },
    credentials: "include",
  })

  const contentType = res.headers.get("content-type") ?? ""
  let payload: unknown = null
  if (contentType.includes("application/json")) {
    try {
      payload = await res.json()
    } catch {
      payload = null
    }
  } else if (res.status !== 204) {
    try {
      payload = await res.text()
    } catch {
      payload = null
    }
  }

  if (!res.ok) {
    if (isApiErrorBody(payload)) {
      throw new ApiError(
        payload.error.code,
        payload.error.message,
        payload.error.details,
        res.status,
      )
    }
    const fallbackMessage =
      typeof payload === "string" && payload.trim().length > 0
        ? payload
        : `Request failed with status ${res.status}`
    throw new ApiError(
      "HTTP_ERROR",
      fallbackMessage,
      payload,
      res.status,
    )
  }

  if (res.status === 204) {
    return undefined as T
  }
  if (isApiResponse<T>(payload)) {
    return payload.data
  }
  throw new ApiError("INVALID_RESPONSE", "Unexpected API response format", payload, res.status)
}
