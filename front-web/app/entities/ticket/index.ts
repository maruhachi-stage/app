export type TicketType = "general" | "university" | "highschool" | "child"
export type TicketCounts = Record<TicketType, number>

export const TICKET_TYPES: TicketType[] = ["general", "university", "highschool", "child"]

export function buildTypeQueue(counts: TicketCounts): TicketType[] {
  return TICKET_TYPES.flatMap(type => Array<TicketType>(counts[type]).fill(type))
}

export function totalTicketCount(counts: TicketCounts): number {
  return TICKET_TYPES.reduce((sum, t) => sum + counts[t], 0)
}

export { formatJst, formatDateJst, todayJst, jstDateLabel } from "~/shared/lib/date"
