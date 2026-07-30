import { FiEdit3, FiGrid, FiRefreshCw } from "react-icons/fi"
import { useOutletContext } from "react-router"
import { ErrorMessage, LoadingMessage } from "~/components/admin/AsyncState"
import type { AdminLayoutContext } from "~/components/admin/AdminLayout"
import { useSeatLayouts } from "~/features/seat-layouts/hooks/useSeatLayouts"
import type { AdminScreen } from "~/types/admin"

const sizeLabels: Record<AdminScreen["size"], string> = { large: "大", medium: "中", small: "小" }

export function SeatLayoutsPage() {
  const { editKey, canEdit } = useOutletContext<AdminLayoutContext>()
  const { screens, loading, error, reload } = useSeatLayouts(editKey)
  if (loading) return <LoadingMessage />
  if (error) return <ErrorMessage message={error} onRetry={reload} />
  return <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><header className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-lg font-black">スクリーン / 座席レイアウト</h3><p className="mt-1 text-sm font-bold text-slate-500">スクリーンごとの座席レイアウトを確認します。</p></div><button type="button" onClick={reload} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-700 hover:border-rose-300 hover:bg-rose-50"><FiRefreshCw />更新</button></header><div className="divide-y divide-slate-100">{screens.length === 0 ? <p className="px-5 py-8 text-sm font-bold text-slate-500">スクリーンが登録されていません。</p> : screens.map(screen => <ScreenRow key={screen.id} screen={screen} canEdit={canEdit} />)}</div></section>
}

function ScreenRow({ screen, canEdit }: { screen: AdminScreen; canEdit: boolean }) {
  return <div className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"><div className="flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500"><FiGrid /></span><div><div className="flex flex-wrap items-center gap-2"><p className="font-black">{screen.name}</p><span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-600">{sizeLabels[screen.size]}サイズ</span>{screen.layoutVersion && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-700">v{screen.layoutVersion}</span>}</div><p className="mt-1 text-xs font-bold text-slate-500">座席 {screen.seatCount}/{screen.totalSeats} / 比率 {screen.aspectRatio ?? "-"} / Layout ID {screen.layoutId ?? "-"}</p></div></div><button type="button" disabled={!canEdit} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"><FiEdit3 />座席を編集</button></div>
}
