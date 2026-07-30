import { useState } from "react"
import { FiCheckCircle, FiChevronLeft, FiChevronRight, FiGrid, FiKey, FiLock, FiMenu, FiMonitor, FiX } from "react-icons/fi"
import { NavLink, Outlet } from "react-router"
import { ThemeModeSelect } from "~/components/admin/ThemeModeSelect"
import { useEditAccess } from "~/features/edit-access/hooks/useEditAccess"
import { useThemeMode } from "~/hooks/useThemeMode"
import type { EditKeyStatus } from "~/types/admin"

export type AdminLayoutContext = { editKey: string; canEdit: boolean }
const navigation = [{ to: "/", end: true, label: "ダッシュボード", icon: FiMonitor }, { to: "/seat-layouts", end: false, label: "座席レイアウト", icon: FiGrid }]

export function AdminLayout() {
  const access = useEditAccess(); const { mode, setMode } = useThemeMode(); const [collapsed, setCollapsed] = useState(false); const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  return <main className="admin-layout" data-sidebar-collapsed={collapsed} data-mobile-menu-open={mobileMenuOpen}>
    <aside className="admin-layout__sidebar">
      <div className="flex min-h-[var(--admin-header-height)] items-center border-b border-admin-border px-3"><div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}><span className="grid size-9 place-items-center rounded-lg bg-admin-accent text-admin-accent-foreground"><FiMonitor /></span><div className={collapsed ? "sr-only" : "min-w-0"}><p className="text-xs font-black tracking-[0.18em] text-admin-accent">HAL Cinema</p><h1 className="text-lg font-black">管理画面</h1></div></div></div>
      <div className="border-b border-admin-border p-3"><button type="button" onClick={() => setCollapsed(value => !value)} className="hidden h-9 w-full items-center justify-center rounded-lg border border-admin-border bg-admin-surface text-admin-muted-foreground lg:flex">{collapsed ? <FiChevronRight /> : <FiChevronLeft />}</button></div>
      <nav className="admin-layout__nav grid gap-1 p-3">{navigation.map(item => { const Icon = item.icon; return <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `flex items-center rounded-lg border px-3 py-2.5 ${isActive ? "border-admin-accent bg-admin-muted text-admin-foreground" : "border-transparent text-admin-muted-foreground hover:border-admin-border hover:bg-admin-muted"} ${collapsed ? "justify-center" : "gap-3"}`}><Icon className="size-4" /><span className={collapsed ? "sr-only" : "text-sm font-black"}>{item.label}</span></NavLink> })}</nav>
      </aside>
    <button type="button" aria-label="メニューを閉じる" className="admin-layout__backdrop" onClick={() => setMobileMenuOpen(false)} />
    <section className="admin-layout__content">
      <header className="sticky top-0 z-20 min-h-[var(--admin-header-height)] border-b border-admin-border bg-admin-surface/95 px-4 py-3 backdrop-blur sm:px-5"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-3"><button type="button" aria-label="メニューを開く" onClick={() => setMobileMenuOpen(true)} className="grid size-10 place-items-center rounded-lg border border-admin-border text-admin-muted-foreground lg:hidden"><FiMenu /></button><div><p className="text-xs font-bold text-admin-muted-foreground">HAL Cinema</p><h2 className="text-2xl font-black">管理画面</h2></div></div><div className="grid gap-2 sm:flex sm:items-center"><ThemeModeSelect mode={mode} onChange={setMode} /><EditKeyBadge status={access.editKeyStatus} /><label className="flex h-10 items-center gap-2 rounded-lg border border-admin-border bg-admin-surface px-3 text-sm"><FiKey className="text-admin-muted-foreground" /><input type="password" value={access.editKey} onChange={event => access.setEditKey(event.target.value)} placeholder="編集キーを入力" className="min-w-0 flex-1 bg-transparent text-admin-foreground outline-none" /></label><button type="button" onClick={access.verify} disabled={access.checkingKey} className="h-10 rounded-lg bg-admin-accent px-4 text-sm font-black text-admin-accent-foreground hover:bg-admin-accent-hover">{access.checkingKey ? "確認中" : "編集を確認"}</button><button type="button" onClick={access.clear} className="h-10 rounded-lg border border-admin-border px-4 text-sm font-bold text-admin-muted-foreground"><FiX className="inline" />解除</button></div></div>{access.error && <p className="mt-3 border-t border-admin-border pt-2 text-sm font-bold text-admin-danger">{access.error}</p>}</header>
      <div className="admin-layout__main p-4 sm:p-5"><Outlet context={{ editKey: access.editKey, canEdit: access.canEdit } satisfies AdminLayoutContext} /></div>
    </section>
  </main>
}

function EditKeyBadge({ status }: { status: EditKeyStatus }) {
  const labels: Record<EditKeyStatus, string> = { valid: "編集キー確認済み", invalid: "キーが不正", missing: "キー未設定", unchecked: "未確認" }
  return <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-admin-border bg-admin-muted px-3 text-xs font-black text-admin-muted-foreground">{status === "valid" ? <FiCheckCircle className="text-admin-success" /> : <FiLock />}{labels[status]}</span>
}
