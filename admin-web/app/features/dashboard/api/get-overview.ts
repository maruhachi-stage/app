import { apiRequest } from "~/lib/api-client"
import type { AdminOverview } from "~/types/admin"

export function getOverview(editKey: string) {
  return apiRequest<AdminOverview>("/api/admin/overview", { headers: editKey ? { "X-Admin-Edit-Key": editKey } : {} })
}
