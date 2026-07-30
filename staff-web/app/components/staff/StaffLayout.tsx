import { useEffect, useState } from "react"
import { FiChevronLeft, FiChevronRight, FiGrid, FiLogOut, FiMenu, FiMonitor } from "react-icons/fi"
import { NavLink, Outlet, useNavigate } from "react-router"
import { ThemeModeSelect } from "~/components/staff/ThemeModeSelect"
import { getCurrentStaff, logout } from "~/features/auth/api/staff-auth"
import type { AuthenticatedStaff } from "~/features/auth/domain/staff"
import { useThemeMode } from "~/hooks/useThemeMode"

export type StaffLayoutContext = { staff: AuthenticatedStaff }

const navigation = [
  { to: "/", end: true, label: "ダッシュボード", icon: FiMonitor },
  { to: "/seat-layouts", end: false, label: "スクリーンレイアウト", icon: FiGrid },
]

export function StaffLayout() {
  const navigate = useNavigate()
  const { mode, setMode } = useThemeMode()
  const [staff, setStaff] = useState<AuthenticatedStaff | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    let active = true
    void getCurrentStaff().then((result) => { if (active) setStaff(result) }).catch(() => { if (active) navigate("/login", { replace: true }) })
    return () => { active = false }
  }, [navigate])

  async function handleLogout() {
    try { await logout() } finally { navigate("/login", { replace: true }) }
  }

  if (!staff) return <main className="grid min-h-dvh place-items-center bg-admin-canvas text-sm font-bold text-admin-muted-foreground">認証情報を確認しています…</main>

  return <main className="admin-layout" data-sidebar-collapsed={collapsed} data-mobile-menu-open={mobileMenuOpen}>
    <aside className="admin-layout__sidebar">
      <div className="flex min-h-[var(--admin-header-height)] items-center border-b border-admin-border px-3"><div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}><span className="grid size-9 place-items-center rounded-lg bg-admin-accent text-admin-accent-foreground"><FiMonitor /></span><div className={collapsed ? "sr-only" : "min-w-0"}><p className="text-xs font-black tracking-[0.18em] text-admin-accent">HAL Cinema</p><h1 className="text-lg font-black">スタッフ</h1></div></div></div>
      <div className="border-b border-admin-border p-3"><button type="button" aria-label="サイドバーを切り替える" onClick={() => setCollapsed(value => !value)} className="hidden h-9 w-full items-center justify-center rounded-lg border border-admin-border bg-admin-surface text-admin-muted-foreground lg:flex">{collapsed ? <FiChevronRight /> : <FiChevronLeft />}</button></div>
      <nav className="admin-layout__nav grid gap-1 p-3">{navigation.map(item => { const Icon = item.icon; return <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `flex items-center rounded-lg border px-3 py-2.5 ${isActive ? "border-admin-accent bg-admin-muted text-admin-foreground" : "border-transparent text-admin-muted-foreground hover:border-admin-border hover:bg-admin-muted"} ${collapsed ? "justify-center" : "gap-3"}`}><Icon className="size-4" /><span className={collapsed ? "sr-only" : "text-sm font-black"}>{item.label}</span></NavLink> })}</nav>
    </aside>
    <button type="button" aria-label="メニューを閉じる" className="admin-layout__backdrop" onClick={() => setMobileMenuOpen(false)} />
    <section className="admin-layout__content"><header className="sticky top-0 z-20 min-h-[var(--admin-header-height)] border-b border-admin-border bg-admin-surface/95 px-4 py-3 backdrop-blur sm:px-5"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><button type="button" aria-label="メニューを開く" onClick={() => setMobileMenuOpen(true)} className="grid size-10 place-items-center rounded-lg border border-admin-border text-admin-muted-foreground lg:hidden"><FiMenu /></button><div><p className="text-xs font-bold text-admin-muted-foreground">HAL Cinema</p><h2 className="text-2xl font-black">スタッフ画面</h2></div></div><div className="flex items-center gap-2"><ThemeModeSelect mode={mode} onChange={setMode} /><span className="hidden text-right text-sm font-bold sm:block"><span className="block">{staff.displayName}</span><span className="text-xs text-admin-muted-foreground">{staff.role.name}</span></span><button type="button" aria-label="ログアウト" onClick={() => void handleLogout()} className="grid size-10 place-items-center rounded-lg border border-admin-border text-admin-muted-foreground"><FiLogOut /></button></div></div></header><div className="admin-layout__main p-4 sm:p-5"><Outlet context={{ staff } satisfies StaffLayoutContext} /></div></section>
  </main>
}
