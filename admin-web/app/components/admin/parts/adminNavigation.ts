import {
  FiBarChart2,
  FiGrid,
} from "react-icons/fi"
import type { IconType } from "react-icons"
import type { AdminScreen, AdminSection } from "~/domain/admin/types"

export const NAV_ITEMS: { id: AdminSection; label: string; description: string; icon: IconType }[] = [
  { id: "dashboard", label: "ダッシュボード", description: "運営状況", icon: FiBarChart2 },
  { id: "seat-layouts", label: "座席マスター", description: "スクリーン構成", icon: FiGrid },
]

export const SECTION_TITLES: Record<AdminSection, string> = {
  dashboard: "ダッシュボード",
  "seat-layouts": "スクリーン / 座席マスター",
}

export const SIZE_LABELS: Record<AdminScreen["size"], string> = {
  large: "大",
  medium: "中",
  small: "小",
}
