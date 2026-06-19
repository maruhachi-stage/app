import {
  FiAlertTriangle,
  FiCheckCircle,
  FiEdit3,
  FiGrid,
  FiKey,
  FiLock,
  FiMonitor,
  FiRefreshCw,
} from "react-icons/fi"
import type { IconType } from "react-icons"
import {
  SIZE_LABELS,
} from "~/components/admin/parts/adminNavigation"
import type {
  AdminOverview,
  AdminScreen,
  AdminSection,
  EditKeyStatus,
} from "~/domain/admin/types"

export function AdminContent({
  section,
  overview,
  canEdit,
  onReload,
  onSelectSection,
}: {
  section: AdminSection
  overview: AdminOverview
  canEdit: boolean
  onReload: () => void
  onSelectSection: (section: AdminSection) => void
}) {
  if (section === "seat-layouts") {
    return <SeatLayoutsPanel screens={overview.screens.items} canEdit={canEdit} />
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard
          label="スクリーン"
          value={`${overview.screens.total}面`}
          detail={`${overview.screens.seats}席を管理`}
          icon={FiMonitor}
          tone="rose"
        />
        <MetricCard
          label="座席レイアウト"
          value={`${overview.screens.items.filter(screen => screen.layoutId !== null).length}件`}
          detail="公開中レイアウトの確認"
          icon={FiGrid}
          tone="blue"
        />
        <MetricCard
          label="編集権限"
          value={canEdit ? "許可" : "未許可"}
          detail={canEdit ? "編集APIを利用できます" : "編集キーを入力してください"}
          icon={canEdit ? FiCheckCircle : FiLock}
          tone={canEdit ? "emerald" : "slate"}
        />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-black">座席マスター管理</h3>
            <p className="mt-1 text-sm font-bold text-slate-500">
              次に作る座席マスター修正ページへの入口です。不要な管理機能はまだ置いていません。
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectSection("seat-layouts")}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 text-sm font-black text-white transition hover:bg-rose-700"
          >
            <FiGrid aria-hidden="true" className="size-4" />
            座席マスターを開く
          </button>
        </div>
      </section>

      <button
        type="button"
        onClick={onReload}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
      >
        <FiRefreshCw aria-hidden="true" className="size-4" />
        最新状態に更新
      </button>
    </div>
  )
}

export function EditKeyBadge({ status }: { status: EditKeyStatus }) {
  const style = {
    valid: "border-emerald-200 bg-emerald-50 text-emerald-700",
    invalid: "border-rose-200 bg-rose-50 text-rose-700",
    missing: "border-amber-200 bg-amber-50 text-amber-700",
    unchecked: "border-slate-200 bg-slate-50 text-slate-600",
  }[status]

  const label = {
    valid: "編集許可済",
    invalid: "キー不一致",
    missing: "キー未設定",
    unchecked: "未確認",
  }[status]

  return (
    <span className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-xs font-black ${style}`}>
      {status === "valid" ? (
        <FiCheckCircle aria-hidden="true" className="size-4" />
      ) : status === "missing" ? (
        <FiAlertTriangle aria-hidden="true" className="size-4" />
      ) : (
        <FiKey aria-hidden="true" className="size-4" />
      )}
      {label}
    </span>
  )
}

function SeatLayoutsPanel({ screens, canEdit }: { screens: AdminScreen[]; canEdit: boolean }) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <PanelHeader
        icon={FiMonitor}
        title="スクリーン / 座席マスター"
        description="スクリーンごとの座席レイアウトを確認します。"
        canEdit={canEdit}
      />
      <div className="divide-y divide-slate-100">
        {screens.map(screen => (
          <div
            key={screen.id}
            className="grid gap-3 px-5 py-4 transition hover:bg-rose-50/40 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
          >
            <div>
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
                  <FiGrid aria-hidden="true" className="size-4" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-slate-950">{screen.name}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-600">
                      {SIZE_LABELS[screen.size]}サイズ
                    </span>
                    {screen.layoutVersion && (
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-700">
                        v{screen.layoutVersion}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    座席 {screen.seatCount}/{screen.totalSeats} / 比率 {screen.aspectRatio ?? "-"} / Layout ID {screen.layoutId ?? "-"}
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              disabled={!canEdit}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FiEdit3 aria-hidden="true" className="size-4" />
              座席を編集
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

function PanelHeader({
  icon: Icon,
  title,
  description,
  canEdit,
}: {
  icon: IconType
  title: string
  description: string
  canEdit: boolean
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600">
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <div>
          <h3 className="text-lg font-black">{title}</h3>
          <p className="mt-0.5 text-sm font-bold text-slate-500">{description}</p>
        </div>
      </div>
      <span className={`inline-flex h-9 items-center rounded-lg border px-3 text-xs font-black ${
        canEdit
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-600"
      }`}
      >
        {canEdit ? "編集可能" : "編集キーが必要"}
      </span>
    </div>
  )
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  detail: string
  icon: IconType
  tone: "rose" | "blue" | "emerald" | "slate"
}) {
  const toneClass = {
    rose: "border-rose-200 bg-rose-50 text-rose-600",
    blue: "border-sky-200 bg-sky-50 text-sky-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    slate: "border-slate-200 bg-slate-50 text-slate-600",
  }[tone]

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-tight">{value}</p>
          <p className="mt-2 text-sm font-bold text-slate-500">{detail}</p>
        </div>
        <span className={`grid size-10 shrink-0 place-items-center rounded-lg border ${toneClass}`}>
          <Icon aria-hidden="true" className="size-5" />
        </span>
      </div>
    </section>
  )
}
