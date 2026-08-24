import { staffApiPaths } from "~/config/api"
import { apiRequest } from "~/lib/api-client"
import type { StaffScreen } from "~/types/staff"

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

type SeatLayoutsResponse = {
  screens: { items: StaffScreenResponse[] }
}

export async function getSeatLayouts(): Promise<StaffScreen[]> {
  const response = await apiRequest<SeatLayoutsResponse>(staffApiPaths.overview)
  return response.screens.items.map(toStaffScreen)
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
