import type { AdminOverview } from "~/domain/admin/types"

type ApiResponse<T> = { data: T; meta?: { requestId: string } }
type ApiErrorBody = {
  error: { code: string; message: string; details?: unknown }
  meta?: { requestId: string }
}
type AdminApiOptions = RequestInit & { editKey?: string }

export class AdminApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
    public readonly status?: number,
  ) {
    super(message)
    this.name = "AdminApiError"
  }
}

export async function getAdminOverview(editKey: string) {
  return adminApiFetch<AdminOverview>("/admin/overview", { editKey })
}

export async function verifyAdminEditKey(editKey: string) {
  return adminApiFetch<{ configured: boolean; valid: boolean }>("/admin/edit-key/verify", {
    method: "POST",
    editKey,
  })
}

export async function checkAdminEditAccess(editKey: string) {
  return adminApiFetch<{ available: boolean }>("/admin/edit-access", { editKey })
}

async function adminApiFetch<T>(path: string, options?: AdminApiOptions): Promise<T> {
  const headers: Record<string, string> = {}
  if (options?.body !== undefined) headers["Content-Type"] = "application/json"
  if (options?.editKey) headers["X-Admin-Edit-Key"] = options.editKey

  const { editKey: _editKey, ...requestOptions } = options ?? {}
  const res = await fetch(`/api${path}`, {
    ...requestOptions,
    headers: { ...headers, ...requestOptions.headers },
    credentials: "include",
  })

  const payload = await readPayload(res)
  if (!res.ok) {
    if (isApiErrorBody(payload)) {
      throw new AdminApiError(payload.error.code, payload.error.message, payload.error.details, res.status)
    }
    const fallbackMessage =
      typeof payload === "string" && payload.trim().length > 0
        ? payload
        : `Request failed with status ${res.status}`
    throw new AdminApiError("HTTP_ERROR", fallbackMessage, payload, res.status)
  }

  if (res.status === 204) return undefined as T
  if (!isApiResponse<T>(payload)) {
    throw new AdminApiError("INVALID_RESPONSE", "Unexpected API response format", payload, res.status)
  }
  return (payload as ApiResponse<T>).data
}

async function readPayload(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    return res.json().catch(() => null)
  }
  if (res.status === 204) return null
  return res.text().catch(() => null)
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (!value || typeof value !== "object") return false
  const error = (value as Record<string, unknown>).error as Record<string, unknown> | undefined
  return !!error && typeof error.code === "string" && typeof error.message === "string"
}

function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  if (!value || typeof value !== "object") return false
  return "data" in (value as Record<string, unknown>)
}
