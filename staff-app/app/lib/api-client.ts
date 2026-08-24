import { apiPath } from "~/config/api"

type ApiResponse<T> = { data: T; meta?: { requestId: string } }
type ApiErrorBody = { error: { code: string; message: string; details?: unknown } }

export class ApiError extends Error {
  constructor(public readonly code: string, message: string, public readonly details?: unknown, public readonly status?: number) {
    super(message)
    this.name = "ApiError"
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body !== undefined && !headers.has("Content-Type")) headers.set("Content-Type", "application/json")
  const response = await fetch(apiPath(path), { ...options, headers, credentials: "include" })
  const payload = await readPayload(response)
  if (!response.ok) {
    if (isApiErrorBody(payload)) throw new ApiError(payload.error.code, payload.error.message, payload.error.details, response.status)
    const message = typeof payload === "string" && payload.trim() ? payload : `Request failed with status ${response.status}`
    throw new ApiError("HTTP_ERROR", message, payload, response.status)
  }
  if (response.status === 204) return undefined as T
  if (!isApiResponse<T>(payload)) throw new ApiError("INVALID_RESPONSE", "Unexpected API response format", payload, response.status)
  return payload.data
}

async function readPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) return response.json().catch(() => null)
  if (response.status === 204) return null
  return response.text().catch(() => null)
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (!value || typeof value !== "object") return false
  const error = (value as Record<string, unknown>).error as Record<string, unknown> | undefined
  return !!error && typeof error.code === "string" && typeof error.message === "string"
}

function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  return !!value && typeof value === "object" && "data" in (value as Record<string, unknown>)
}
