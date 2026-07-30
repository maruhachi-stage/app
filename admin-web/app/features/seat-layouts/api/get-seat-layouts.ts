import { staffApiPaths } from "~/config/api"
import { apiRequest } from "~/lib/api-client"
import type { StaffScreen } from "~/types/staff"

export async function getSeatLayouts(): Promise<StaffScreen[]> {
  const overview = await apiRequest<{ screens: { items: StaffScreen[] } }>(staffApiPaths.overview)
  return overview.screens.items
}
