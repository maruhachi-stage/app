import { staffApiPaths } from "~/config/api"
import { apiRequest } from "~/lib/api-client"
import type { StaffOverview, StaffScreen } from "~/types/staff"

type StaffScreenResponse = {
  id: number
  name: string
  size: "large" | "medium" | "small"
  totalSeats: number
  seatCount: number
  layoutId: number | null
  layoutVersion: number | null
  aspectRatio: string | null
}

type StaffOverviewResponse = {
  screens: {
    total: number
    seats: number
    items: StaffScreenResponse[]
  }
}

export async function getOverview(): Promise<StaffOverview> {
  const response = await apiRequest<StaffOverviewResponse>(staffApiPaths.overview)
  return {
    screens: {
      total: response.screens.total,
      seats: response.screens.seats,
      items: response.screens.items.map(toStaffScreen),
    },
  }
}

function toStaffScreen(response: StaffScreenResponse): StaffScreen {
  return {
    id: response.id,
    name: response.name,
    size: response.size,
    totalSeats: response.totalSeats,
    seatCount: response.seatCount,
    layoutId: response.layoutId,
    layoutVersion: response.layoutVersion,
    aspectRatio: response.aspectRatio,
  }
}
