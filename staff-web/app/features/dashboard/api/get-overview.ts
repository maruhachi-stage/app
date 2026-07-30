import { staffApiPaths } from "~/config/api"
import { apiRequest } from "~/lib/api-client"
import type { StaffOverview } from "~/types/staff"

export function getOverview() {
  return apiRequest<StaffOverview>(staffApiPaths.overview)
}
