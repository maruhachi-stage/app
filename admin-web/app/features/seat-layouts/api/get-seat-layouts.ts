import { apiRequest } from "~/lib/api-client"
import type { AdminScreen } from "~/types/admin"

export async function getSeatLayouts(editKey: string): Promise<AdminScreen[]> {
  const overview = await apiRequest<{ screens: { items: AdminScreen[] } }>("/api/admin/overview", { headers: editKey ? { "X-Admin-Edit-Key": editKey } : {} })
  return overview.screens.items
}
