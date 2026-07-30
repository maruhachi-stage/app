import { useState } from "react"
import { FiCheckCircle, FiChevronLeft, FiChevronRight, FiGrid, FiKey, FiLock, FiMonitor, FiX } from "react-icons/fi"
import { NavLink, Outlet } from "react-router"
import { useEditAccess } from "~/features/edit-access/hooks/useEditAccess"
import type { EditKeyStatus } from "~/types/admin"

export type AdminLayoutContext = { editKey: string; canEdit: boolean }

const navigation = [
  { to: "/", end: true, label: "ダッシュボード", description: "運用状況", icon: FiMonitor },
  { to: "/seat-layouts", end: false, label: "座席レイアウト", description: "スクリーン設定", icon: FiGrid },
]

export function AdminLayout() {
  const access = useEditAccess()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  return <main className="admin-shell bg-slate-50 text-slate-950">
    <div className={`admin-shell-grid grid ${sidebarCollapsed ? "admin-shell-grid-collapsed" : "admin-shell-grid-expanded"}`}>
      <aside className="admin-sidebar border-r border-slate-200 bg-white">
        <div className="admin-header-height flex items-center border-b border-slate-200 px-3"><div className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3"}`}><span className="grid size-9 place-items-center rounded-lg bg-rose-600 text-white"><FiMonitor /></span><div className={sidebarCollapsed ? "sr-only" : "min-w-0"}><p className="text-xs font-black uppercase tracking-[0.18em] text-rose-600">HAL Cinema</p><h1 className="mt-0.5 truncate text-lg font-black tracking-tight">管理画面</h1></div></div></div>
        <div className="border-b border-slate-200 p-3"><button type="button" onClick={() => setSidebarCollapsed(value => !value)} aria-label={sidebarCollapsed ? "サイドナビを開く" : "サイドナビを閉じる"} className="hidden h-9 w-full items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 lg:flex">{sidebarCollapsed ? <FiChevronRight /> : <FiChevronLeft />}</button></div>
        <nav className="admin-sidebar-nav grid gap-1 p-3">{navigation.map(item => { const Icon = item.icon; return <NavLink key={item.to} to={item.to} end={item.end} title={sidebarCollapsed ? item.label : undefined} className={({ isActive }) => `flex items-center rounded-lg border transition ${isActive ? "border-rose-200 bg-rose-50 text-slate-950" : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50"} ${sidebarCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"}`}><span className="grid size-8 shrink-0 place-items-center rounded-md border border-slate-200 bg-white text-slate-500"><Icon /></span><span className={sidebarCollapsed ? "sr-only" : "min-w-0"}><span className="block text-sm font-black">{item.label}</span><span className="mt-0.5 block text-xs text-slate-500">{item.description}</span></span></NavLink> })}</nav>
      </aside>
      <section className="admin-main min-w-0">
        <header className="admin-header admin-header-height sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur"><div className="flex h-full flex-col gap-3 px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-bold text-slate-500">HAL Cinema</p><h2 className="mt-0.5 text-2xl font-black tracking-tight">管理画面</h2></div><div className="grid gap-2 sm:flex sm:items-center"><EditKeyBadge status={access.editKeyStatus} />{access.canEdit && <span className="inline-flex h-10 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-black text-emerald-700">編集可能</span>}<label className="flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold sm:w-56"><FiKey className="size-4 text-slate-400" /><input type="password" value={access.editKey} onChange={event => access.setEditKey(event.target.value)} placeholder="編集キーを入力" className="min-w-0 flex-1 bg-transparent outline-none" /></label><button type="button" onClick={access.verify} disabled={access.checkingKey} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 text-sm font-black text-white hover:bg-rose-700 disabled:cursor-wait disabled:bg-slate-400"><FiCheckCircle />{access.checkingKey ? "確認中" : "編集を確認"}</button><button type="button" onClick={access.clear} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"><FiX />解除</button></div></div>{access.error && <p className="border-t border-rose-200 bg-rose-50 px-5 py-2 text-sm font-bold text-rose-700">{access.error}</p>}</header>
        <div className="admin-main-scroll px-4 py-4 sm:px-5 sm:py-5"><Outlet context={{ editKey: access.editKey, canEdit: access.canEdit } satisfies AdminLayoutContext} /></div>
      </section>
    </div>
  </main>
}

function EditKeyBadge({ status }: { status: EditKeyStatus }) {
  const labels: Record<EditKeyStatus, string> = { valid: "編集キー確認済み", invalid: "キーが不正", missing: "キー未設定", unchecked: "未確認" }
  const styles: Record<EditKeyStatus, string> = { valid: "border-emerald-200 bg-emerald-50 text-emerald-700", invalid: "border-rose-200 bg-rose-50 text-rose-700", missing: "border-amber-200 bg-amber-50 text-amber-700", unchecked: "border-slate-200 bg-slate-50 text-slate-600" }
  return <span className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-xs font-black ${styles[status]}`}>{status === "valid" ? <FiCheckCircle /> : <FiLock />}{labels[status]}</span>
}
