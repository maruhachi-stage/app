export function getNext7Days(): { iso: string; label: string }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const iso = d.toLocaleDateString("sv", { timeZone: "Asia/Tokyo" })
    const label = d.toLocaleDateString("ja-JP", {
      timeZone: "Asia/Tokyo",
      month: "numeric",
      day: "numeric",
      weekday: "short",
    })
    return { iso, label }
  })
}

export function formatJst(isoOrDate: string | Date): string {
  return new Date(isoOrDate).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatDateJst(isoOrDate: string | Date): string {
  return new Date(isoOrDate).toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  })
}

export function formatTimeJst(isoOrDate: string | Date): string {
  return new Date(isoOrDate).toLocaleTimeString("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

export function todayJst(): string {
  return new Date().toLocaleDateString("sv", { timeZone: "Asia/Tokyo" })
}

export function jstDateLabel(isoString: string): string {
  return new Date(isoString).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  })
}
