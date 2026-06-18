import {
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiKey,
  FiRefreshCw,
  FiShield,
  FiX,
} from "react-icons/fi"
import { useAdminDashboard } from "~/hooks/useAdminDashboard"
import { AdminContent, EditKeyBadge } from "~/components/admin/parts/AdminPanels"
import { NAV_ITEMS, SECTION_TITLES } from "~/components/admin/parts/adminNavigation"

export function AdminHomePage() {
  const {
    activeSection,
    canEdit,
    checkingKey,
    editAccessStatus,
    editKey,
    editKeyStatus,
    error,
    loading,
    overview,
    sidebarCollapsed,
    actions,
  } = useAdminDashboard()

  const selectedNavItem = NAV_ITEMS.find(item => item.id === activeSection) ?? NAV_ITEMS[0]
  const ActiveIcon = selectedNavItem.icon

  return (
    <main className="admin-shell bg-slate-50 text-slate-950">
      <div
        className={`admin-shell-grid grid transition-[grid-template-columns] duration-200 ease-out ${
          sidebarCollapsed ? "admin-shell-grid-collapsed" : "admin-shell-grid-expanded"
        }`}
      >
        <aside className="admin-sidebar border-r border-slate-200 bg-white">
          <div className="admin-header-height border-b border-slate-200 px-3">
            <div className={`flex h-full items-center ${sidebarCollapsed ? "justify-center" : "gap-3"}`}>
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-rose-600 text-white">
                <FiShield aria-hidden="true" className="size-4" />
              </span>
              <div className={sidebarCollapsed ? "sr-only" : "min-w-0"}>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-600">HAL Cinema</p>
                <h1 className="mt-0.5 truncate text-lg font-black tracking-tight">映画館管理画面</h1>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200 p-3">
            <button
              type="button"
              onClick={() => actions.setSidebarCollapsed(value => !value)}
              aria-label={sidebarCollapsed ? "サイドナビを開く" : "サイドナビを閉じる"}
              className={`hidden h-9 items-center rounded-lg border border-slate-200 bg-white text-sm font-black text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 lg:flex ${
                sidebarCollapsed ? "w-full justify-center" : "w-full justify-between px-3"
              }`}
            >
              {!sidebarCollapsed && <span>ナビゲーション</span>}
              {sidebarCollapsed ? (
                <FiChevronRight aria-hidden="true" className="size-4" />
              ) : (
                <FiChevronLeft aria-hidden="true" className="size-4" />
              )}
            </button>
          </div>

          <nav className="admin-sidebar-nav grid gap-1 p-3">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon
              const active = activeSection === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => actions.setActiveSection(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  aria-label={item.label}
                  className={`group flex w-full items-center rounded-lg border text-left transition ${
                    active
                      ? "border-rose-200 bg-rose-50 text-slate-950"
                      : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50"
                  } ${sidebarCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"}`}
                >
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-md border ${
                      active ? "border-rose-200 bg-white text-rose-600" : "border-slate-200 bg-white text-slate-500"
                    }`}
                  >
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <span className={sidebarCollapsed ? "sr-only" : "min-w-0"}>
                    <span className="block text-sm font-black">{item.label}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{item.description}</span>
                  </span>
                </button>
              )
            })}
          </nav>
        </aside>

        <section className="admin-main min-w-0">
          <header className="admin-header admin-header-height sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex h-full flex-col gap-3 px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
                  <ActiveIcon aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-500">{selectedNavItem.description}</p>
                  <h2 className="mt-0.5 truncate text-2xl font-black tracking-tight">{SECTION_TITLES[activeSection]}</h2>
                </div>
              </div>

              <div className="grid gap-2 sm:flex sm:flex-nowrap sm:items-center sm:justify-end">
                <EditKeyBadge status={editKeyStatus} />
                {editAccessStatus === "available" && (
                  <span className="inline-flex h-10 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-black text-emerald-700">
                    API接続済
                  </span>
                )}
                <label className="flex h-10 w-full items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold outline-none transition focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/10 sm:w-52 xl:w-60">
                  <FiKey aria-hidden="true" className="size-4 text-slate-400" />
                  <input
                    type="password"
                    value={editKey}
                    onChange={event => actions.setEditKey(event.target.value)}
                    placeholder="編集キーを入力"
                    className="min-w-0 flex-1 bg-transparent outline-none"
                  />
                </label>
                <button
                  type="button"
                  onClick={actions.verifyEditKey}
                  disabled={checkingKey}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 text-sm font-black text-white transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/30 disabled:cursor-wait disabled:bg-slate-400"
                >
                  <FiCheckCircle aria-hidden="true" className="size-4" />
                  {checkingKey ? "確認中" : "編集許可"}
                </button>
                <button
                  type="button"
                  onClick={actions.clearEditKey}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/20"
                >
                  <FiX aria-hidden="true" className="size-4" />
                  解除
                </button>
              </div>
            </div>
          </header>

          <div className="admin-main-scroll px-4 py-4 sm:px-5 sm:py-5">
            {error && (
              <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white p-10 text-sm font-bold text-slate-500">
                <FiRefreshCw aria-hidden="true" className="size-4 animate-spin" />
                管理情報を読み込み中
              </div>
            ) : overview ? (
              <AdminContent
                section={activeSection}
                overview={overview}
                canEdit={canEdit}
                onReload={() => actions.loadOverview()}
                onSelectSection={actions.setActiveSection}
              />
            ) : null}
          </div>
        </section>
      </div>
    </main>
  )
}
